import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ──────────────────────────────────────────────
// Valid job state transitions
// ──────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  requested: ["accepted", "cancelled"],
  quoted: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed", "disputed"],
  completed: ["confirmed", "disputed"],
  confirmed: ["reviewed"],
  // terminal states
  reviewed: [],
  cancelled: [],
  disputed: [],
};

// Who can trigger each transition
const TRANSITION_PERMISSIONS: Record<
  string,
  "customer" | "provider" | "either"
> = {
  "requested→accepted": "customer",
  "quoted→accepted": "customer",
  "accepted→in_progress": "either",
  "accepted→cancelled": "either",
  "in_progress→completed": "provider",
  "in_progress→disputed": "either",
  "completed→confirmed": "customer",
  "completed→disputed": "either",
  "confirmed→reviewed": "customer",
  "requested→cancelled": "either",
  "quoted→cancelled": "either",
};

// Helper to get authenticated user
async function getAuthUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("غير مصرح");

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email!))
    .first();
  if (!user) throw new Error("المستخدم غير موجود");
  return user;
}

// ──────────────────────────────────────────────
// State Transition Mutation
// ──────────────────────────────────────────────

export const updateStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    newStatus: v.union(
      v.literal("accepted"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("confirmed"),
      v.literal("reviewed"),
      v.literal("cancelled"),
      v.literal("disputed")
    ),
  },
  handler: async (ctx, { jobId, newStatus }) => {
    const user = await getAuthUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("المهمة غير موجودة");

    // Validate user is part of this job
    const isCustomer = job.customerId === user._id;
    const isProvider = job.providerId === user._id;
    if (!isCustomer && !isProvider)
      throw new Error("غير مصرح بتعديل هذه المهمة");

    // Validate transition is allowed
    const allowed = VALID_TRANSITIONS[job.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(
        `لا يمكن الانتقال من "${job.status}" إلى "${newStatus}"`
      );
    }

    // Validate permission for this transition
    const transitionKey = `${job.status}→${newStatus}`;
    const perm = TRANSITION_PERMISSIONS[transitionKey];
    if (perm === "customer" && !isCustomer)
      throw new Error("هذا الإجراء متاح للعميل فقط");
    if (perm === "provider" && !isProvider)
      throw new Error("هذا الإجراء متاح للحرفي فقط");

    // Update job status
    await ctx.db.patch(jobId, {
      status: newStatus,
      statusHistory: [
        ...job.statusHistory,
        {
          status: newStatus,
          timestamp: Date.now(),
          by: user._id,
        },
      ],
    });

    return { success: true };
  },
});

// ──────────────────────────────────────────────
// Direct Hire — customer hires provider directly
// ──────────────────────────────────────────────

export const directHire = mutation({
  args: {
    providerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    price: v.number(),
  },
  handler: async (ctx, { providerId, title, description, price }) => {
    const user = await getAuthUser(ctx);

    if (user._id === providerId)
      throw new Error("لا يمكنك توظيف نفسك");

    const provider = await ctx.db.get(providerId);
    if (!provider) throw new Error("الحرفي غير موجود");
    if (!provider.isProvider)
      throw new Error("المستخدم المحدد ليس حرفياً");

    const jobId = await ctx.db.insert("jobs", {
      customerId: user._id,
      providerId,
      title,
      description,
      price,
      status: "requested",
      statusHistory: [
        {
          status: "requested",
          timestamp: Date.now(),
          by: user._id,
        },
      ],
      isDirectHire: true,
    });

    return jobId;
  },
});

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

// List all jobs for the current user (both customer and provider jobs)
export const listByUser = query({
  args: {
    filter: v.optional(
      v.union(v.literal("active"), v.literal("past"))
    ),
  },
  handler: async (ctx, { filter }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return [];

    // Fetch jobs where user is either customer or provider
    const customerJobs = await ctx.db
      .query("jobs")
      .withIndex("by_customerId", (q) => q.eq("customerId", user._id))
      .collect();

    const providerJobs = await ctx.db
      .query("jobs")
      .withIndex("by_providerId", (q) => q.eq("providerId", user._id))
      .collect();

    // Merge and dedupe
    const jobMap = new Map<string, (typeof customerJobs)[0]>();
    for (const j of [...customerJobs, ...providerJobs]) {
      jobMap.set(j._id, j);
    }
    let allJobs = Array.from(jobMap.values());

    // Filter by active/past
    const activeStatuses = [
      "requested",
      "quoted",
      "accepted",
      "in_progress",
      "completed",
    ];
    const pastStatuses = [
      "confirmed",
      "reviewed",
      "cancelled",
      "disputed",
    ];

    if (filter === "active") {
      allJobs = allJobs.filter((j) => activeStatuses.includes(j.status));
    } else if (filter === "past") {
      allJobs = allJobs.filter((j) => pastStatuses.includes(j.status));
    }

    // Enrich with counterparty info
    const enriched = await Promise.all(
      allJobs.map(async (job) => {
        const isCustomer = job.customerId === user._id;
        const counterpartyId = isCustomer
          ? job.providerId
          : job.customerId;
        const counterparty = await ctx.db.get(counterpartyId);

        let counterpartyAvatarUrl = counterparty?.avatarUrl;
        if (counterparty?.avatarStorageId) {
          counterpartyAvatarUrl =
            (await ctx.storage.getUrl(counterparty.avatarStorageId)) ??
            undefined;
        }

        return {
          ...job,
          userRole: isCustomer ? ("customer" as const) : ("provider" as const),
          counterpartyName: counterparty?.name ?? "مستخدم محذوف",
          counterpartyAvatarUrl,
        };
      })
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Get full job detail with all related data
export const getDetail = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return null;

    const job = await ctx.db.get(jobId);
    if (!job) return null;

    // Access control
    const isCustomer = job.customerId === user._id;
    const isProvider = job.providerId === user._id;
    if (!isCustomer && !isProvider) return null;

    // Get customer info
    const customer = await ctx.db.get(job.customerId);
    let customerAvatarUrl = customer?.avatarUrl;
    if (customer?.avatarStorageId) {
      customerAvatarUrl =
        (await ctx.storage.getUrl(customer.avatarStorageId)) ?? undefined;
    }

    // Get provider info
    const provider = await ctx.db.get(job.providerId);
    let providerAvatarUrl = provider?.avatarUrl;
    if (provider?.avatarStorageId) {
      providerAvatarUrl =
        (await ctx.storage.getUrl(provider.avatarStorageId)) ?? undefined;
    }

    // Get quote if exists
    const quote = job.quoteId ? await ctx.db.get(job.quoteId) : null;

    // Get request if exists
    const request = job.requestId
      ? await ctx.db.get(job.requestId)
      : null;

    // Get messages count
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .collect();

    // Get review if exists
    const review = await ctx.db
      .query("reviews")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .first();

    return {
      ...job,
      userRole: isCustomer ? ("customer" as const) : ("provider" as const),
      customer: {
        _id: customer?._id,
        name: customer?.name ?? "مستخدم محذوف",
        avatarUrl: customerAvatarUrl,
      },
      provider: {
        _id: provider?._id,
        name: provider?.name ?? "مستخدم محذوف",
        avatarUrl: providerAvatarUrl,
        bio: provider?.bio,
      },
      quote: quote
        ? {
            price: quote.price,
            estimatedDuration: quote.estimatedDuration,
            message: quote.message,
          }
        : null,
      request: request
        ? {
            _id: request._id,
            title: request.title,
            budgetMin: request.budgetMin,
            budgetMax: request.budgetMax,
            city: request.city,
          }
        : null,
      messageCount: messages.length,
      review: review
        ? {
            rating: review.rating,
            comment: review.comment,
          }
        : null,
    };
  },
});
