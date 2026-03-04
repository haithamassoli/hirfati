import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { getOptionalAuthUser, requireAuthUser } from "./lib/auth";

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
  returns: v.any(),
  handler: async (ctx, { jobId, content }) => {
    const user = await requireAuthUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job) throw new ConvexError("المهمة غير موجودة");

    // Verify user is part of the job
    if (job.customerId !== user._id && job.providerId !== user._id) {
      throw new ConvexError("غير مصرح بإرسال رسالة في هذه المهمة");
    }

    // Verify chat is eligible
    if (!CHAT_ELIGIBLE_STATUSES.includes(job.status)) {
      throw new ConvexError("لا يمكن إرسال رسائل في هذه المرحلة");
    }

    const trimmed = content.trim();
    if (!trimmed) throw new ConvexError("الرسالة فارغة");

    const messageId = await ctx.db.insert("messages", {
      jobId,
      senderId: user._id,
      content: trimmed,
    });

    // Notify the other party
    const recipientId =
      job.customerId === user._id ? job.providerId : job.customerId;
    await ctx.scheduler.runAfter(0, internal.notifications.notifyNewMessage, {
      recipientId,
      senderName: user.name,
      jobId: jobId,
      preview: trimmed.length > 50 ? trimmed.slice(0, 50) + "..." : trimmed,
    });

    return messageId;
  },
});

// Send an image message
export const sendImage = mutation({
  args: {
    jobId: v.id("jobs"),
    imageStorageId: v.id("_storage"),
    caption: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, { jobId, imageStorageId, caption }) => {
    const user = await requireAuthUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job) throw new ConvexError("المهمة غير موجودة");

    if (job.customerId !== user._id && job.providerId !== user._id) {
      throw new ConvexError("غير مصرح بإرسال رسالة في هذه المهمة");
    }

    if (!CHAT_ELIGIBLE_STATUSES.includes(job.status)) {
      throw new ConvexError("لا يمكن إرسال رسائل في هذه المرحلة");
    }

    const messageId = await ctx.db.insert("messages", {
      jobId,
      senderId: user._id,
      content: caption?.trim() || "",
      imageStorageId,
    });

    // Notify the other party
    const recipientId =
      job.customerId === user._id ? job.providerId : job.customerId;
    await ctx.scheduler.runAfter(0, internal.notifications.notifyNewMessage, {
      recipientId,
      senderName: user.name,
      jobId: jobId,
      preview: caption?.trim() || "صورة",
    });

    return messageId;
  },
});

// Real-time query: fetch messages by jobId
export const listByJob = query({
  args: { jobId: v.id("jobs") },
  returns: v.any(),
  handler: async (ctx, { jobId }) => {
    const user = await getOptionalAuthUser(ctx);
    if (!user) return [];

    const job = await ctx.db.get(jobId);
    if (!job) return [];

    // Only parties can view messages
    if (job.customerId !== user._id && job.providerId !== user._id) return [];

    // Fetch last 50 messages for performance
    const messagesDesc = await ctx.db
      .query("messages")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .order("desc")
      .take(50);
    const messages = messagesDesc.reverse();

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
