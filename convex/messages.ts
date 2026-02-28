import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to get the authenticated user
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

// Chat-eligible statuses: after quote submitted or direct request sent
const CHAT_ELIGIBLE_STATUSES = [
  "requested",
  "quoted",
  "accepted",
  "in_progress",
  "completed",
  "confirmed",
  "reviewed",
  "disputed",
];

// Send a text message
export const send = mutation({
  args: {
    jobId: v.id("jobs"),
    content: v.string(),
  },
  handler: async (ctx, { jobId, content }) => {
    const user = await getAuthUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("المهمة غير موجودة");

    // Verify user is part of the job
    if (job.customerId !== user._id && job.providerId !== user._id) {
      throw new Error("غير مصرح بإرسال رسالة في هذه المهمة");
    }

    // Verify chat is eligible
    if (!CHAT_ELIGIBLE_STATUSES.includes(job.status)) {
      throw new Error("لا يمكن إرسال رسائل في هذه المرحلة");
    }

    const trimmed = content.trim();
    if (!trimmed) throw new Error("الرسالة فارغة");

    return await ctx.db.insert("messages", {
      jobId,
      senderId: user._id,
      content: trimmed,
    });
  },
});

// Send an image message
export const sendImage = mutation({
  args: {
    jobId: v.id("jobs"),
    imageStorageId: v.id("_storage"),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, imageStorageId, caption }) => {
    const user = await getAuthUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("المهمة غير موجودة");

    if (job.customerId !== user._id && job.providerId !== user._id) {
      throw new Error("غير مصرح بإرسال رسالة في هذه المهمة");
    }

    if (!CHAT_ELIGIBLE_STATUSES.includes(job.status)) {
      throw new Error("لا يمكن إرسال رسائل في هذه المرحلة");
    }

    return await ctx.db.insert("messages", {
      jobId,
      senderId: user._id,
      content: caption?.trim() || "",
      imageStorageId,
    });
  },
});

// Real-time query: fetch messages by jobId
export const listByJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return [];

    const job = await ctx.db.get(jobId);
    if (!job) return [];

    // Only parties can view messages
    if (job.customerId !== user._id && job.providerId !== user._id) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .order("asc")
      .collect();

    // Enrich with sender info
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        const senderAvatarUrl = sender?.avatarStorageId
          ? await ctx.storage.getUrl(sender.avatarStorageId)
          : sender?.avatarUrl;
        const imageUrl = msg.imageStorageId
          ? await ctx.storage.getUrl(msg.imageStorageId)
          : null;

        return {
          _id: msg._id,
          _creationTime: msg._creationTime,
          content: msg.content,
          imageUrl,
          senderId: msg.senderId,
          senderName: sender?.name ?? "مستخدم",
          senderAvatar: senderAvatarUrl ?? undefined,
          isMe: msg.senderId === user._id,
        };
      })
    );

    return enriched;
  },
});
