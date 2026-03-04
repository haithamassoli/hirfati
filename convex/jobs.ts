import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { getOptionalAuthUser, requireAuthUser } from "./lib/auth";

// Valid job status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  requested: ["accepted", "cancelled"],
  quoted: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed", "disputed"],
  completed: ["confirmed", "disputed"],
  confirmed: ["reviewed"],
  reviewed: [],
  cancelled: [],
  disputed: [],
};

// Transition job status with validation
export const transitionStatus = mutation({
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
  returns: v.any(),
  handler: async (ctx, { jobId, newStatus }) => {
    const user = await requireAuthUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job) throw new ConvexError("المهمة غير موجودة");

    // Verify user is part of the job
    const isCustomer = job.customerId === user._id;
    const isProvider = job.providerId === user._id;
    if (!isCustomer && !isProvider) throw new ConvexError("غير مصرح بتعديل هذه المهمة");

    // Validate the transition
    const validNext = VALID_TRANSITIONS[job.status];
    if (!validNext || !validNext.includes(newStatus)) {
      throw new ConvexError(
        `لا يمكن الانتقال من "${job.status}" إلى "${newStatus}"`
      );
    }

    // Role-based restrictions
    switch (newStatus) {
      case "in_progress":
        // Either party can trigger from accepted
        break;
      case "completed":
        // Provider only
        if (!isProvider) throw new ConvexError("فقط الحرفي يمكنه تحديد المهمة كمكتملة");
        break;
      case "confirmed":
        // Customer only
        if (!isCustomer) throw new ConvexError("فقط العميل يمكنه تأكيد اكتمال المهمة");
        break;
      case "cancelled":
        // Either party, only before in_progress
        if (job.status === "in_progress" || job.status === "completed") {
          throw new ConvexError("لا يمكن إلغاء المهمة بعد البدء بها");
        }
        break;
      case "disputed":
        // Either party, from in_progress or completed
        if (job.status !== "in_progress" && job.status !== "completed") {
          throw new ConvexError("لا يمكن رفع نزاع في هذه المرحلة");
        }
        break;
    }

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

    // Notify the other party about job status change
    const recipientId = isCustomer ? job.providerId : job.customerId;
    await ctx.scheduler.runAfter(0, internal.notifications.notifyJobStatusChange, {
      recipientId,
      jobTitle: job.title,
      newStatus,
      jobId: jobId,
    });

    return { success: true };
  },
});

// Get job detail with all related data
export const getDetail = query({
  args: { id: v.id("jobs") },
  returns: v.any(),
  handler: async (ctx, { id }) => {
    const user = await getOptionalAuthUser(ctx);
    if (!user) return null;

    const job = await ctx.db.get(id);
    if (!job) return null;

    // Only parties involved can view
    if (job.customerId !== user._id && job.providerId !== user._id) return null;

    const customer = await ctx.db.get(job.customerId);
    const provider = await ctx.db.get(job.providerId);
    const request = job.requestId ? await ctx.db.get(job.requestId) : null;
    const quote = job.quoteId ? await ctx.db.get(job.quoteId) : null;

    // Get category from request
    const category = request ? await ctx.db.get(request.categoryId) : null;

    // Get avatar URLs
    const customerAvatarUrl = customer?.avatarStorageId
      ? await ctx.storage.getUrl(customer.avatarStorageId)
      : customer?.avatarUrl;

    const providerAvatarUrl = provider?.avatarStorageId
      ? await ctx.storage.getUrl(provider.avatarStorageId)
      : provider?.avatarUrl;

    // Get messages count
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_jobId", (q) => q.eq("jobId", id))
      .collect();

    // Get review if exists
    const review = await ctx.db
      .query("reviews")
      .withIndex("by_jobId", (q) => q.eq("jobId", id))
      .first();

    return {
      ...job,
      customerName: customer?.name ?? "عميل",
      customerAvatar: customerAvatarUrl ?? undefined,
      providerName: provider?.name ?? "حرفي",
      providerAvatar: providerAvatarUrl ?? undefined,
      providerBio: provider?.bio,
      categoryNameAr: category?.nameAr ?? "",
      requestTitle: request?.title,
      requestCity: request?.city,
      quotedPrice: quote?.price,
      quotedDuration: quote?.estimatedDuration,
      quoteMessage: quote?.message,
      messageCount: messages.length,
      hasReview: !!review,
      isCustomer: job.customerId === user._id,
      isProvider: job.providerId === user._id,
    };
  },
});

// List jobs for the authenticated user (both customer and provider roles)
export const listByUser = query({
  args: {
    filter: v.optional(v.union(v.literal("active"), v.literal("past"))),
  },
  returns: v.any(),
  handler: async (ctx, { filter }) => {
    const user = await getOptionalAuthUser(ctx);
    if (!user) return [];

    // Get jobs where user is customer or provider
    const customerJobs = await ctx.db
      .query("jobs")
      .withIndex("by_customerId", (q) => q.eq("customerId", user._id))
      .collect();

    const providerJobs = await ctx.db
      .query("jobs")
      .withIndex("by_providerId", (q) => q.eq("providerId", user._id))
      .collect();

    // Combine and deduplicate
    const jobMap = new Map<string, typeof customerJobs[0]>();
    for (const j of [...customerJobs, ...providerJobs]) {
      jobMap.set(j._id, j);
    }

    let jobs = Array.from(jobMap.values());

    // Filter by active/past
    const activeStatuses = ["requested", "quoted", "accepted", "in_progress", "completed"];
    const pastStatuses = ["confirmed", "reviewed", "cancelled", "disputed"];

    if (filter === "active") {
      jobs = jobs.filter((j) => activeStatuses.includes(j.status));
    } else if (filter === "past") {
      jobs = jobs.filter((j) => pastStatuses.includes(j.status));
    }

    // Enrich
    const enriched = await Promise.all(
      jobs.map(async (job) => {
        const otherUserId =
          job.customerId === user._id ? job.providerId : job.customerId;
        const otherUser = await ctx.db.get(otherUserId);
        const otherAvatarUrl = otherUser?.avatarStorageId
          ? await ctx.storage.getUrl(otherUser.avatarStorageId)
          : otherUser?.avatarUrl;

        const request = job.requestId ? await ctx.db.get(job.requestId) : null;
        const category = request
          ? await ctx.db.get(request.categoryId)
          : null;

        return {
          ...job,
          otherPartyName: otherUser?.name ?? "مستخدم",
          otherPartyAvatar: otherAvatarUrl ?? undefined,
          categoryNameAr: category?.nameAr ?? "",
          city: request?.city,
          role: job.customerId === user._id ? ("customer" as const) : ("provider" as const),
        };
      })
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Direct hire: customer sends request directly to a provider
export const directHire = mutation({
  args: {
    providerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    price: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    // Cannot hire yourself
    if (args.providerId === user._id) {
      throw new ConvexError("لا يمكنك توظيف نفسك");
    }

    const provider = await ctx.db.get(args.providerId);
    if (!provider) throw new ConvexError("الحرفي غير موجود");
    if (!provider.isProvider) throw new ConvexError("هذا المستخدم ليس حرفياً");

    const jobId = await ctx.db.insert("jobs", {
      customerId: user._id,
      providerId: args.providerId,
      title: args.title,
      description: args.description,
      price: args.price ?? 0,
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

    // Notify provider about direct hire request
    await ctx.scheduler.runAfter(0, internal.notifications.notifyJobStatusChange, {
      recipientId: args.providerId,
      jobTitle: args.title,
      newStatus: "requested",
      jobId: jobId,
    });

    return jobId;
  },
});

// Provider accepts or rejects a direct hire request
export const respondToDirectHire = mutation({
  args: {
    jobId: v.id("jobs"),
    accept: v.boolean(),
    price: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, { jobId, accept, price }) => {
    const user = await requireAuthUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job) throw new ConvexError("المهمة غير موجودة");
    if (job.providerId !== user._id) throw new ConvexError("غير مصرح");
    if (job.status !== "requested") throw new ConvexError("المهمة ليست في حالة طلب");

    if (accept) {
      await ctx.db.patch(jobId, {
        status: "accepted",
        price: price ?? job.price,
        statusHistory: [
          ...job.statusHistory,
          {
            status: "accepted",
            timestamp: Date.now(),
            by: user._id,
          },
        ],
      });
    } else {
      await ctx.db.patch(jobId, {
        status: "cancelled",
        statusHistory: [
          ...job.statusHistory,
          {
            status: "cancelled",
            timestamp: Date.now(),
            by: user._id,
          },
        ],
      });
    }

    return { success: true };
  },
});
