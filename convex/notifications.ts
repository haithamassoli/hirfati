"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import webpush from "web-push";

// Configure web-push with VAPID details
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:info@hirfati.jo",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

// Send push notification to a specific user
export const sendToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    type: v.optional(v.string()),
    jobId: v.optional(v.string()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

    // Get subscriptions using internal query
    const subs = await ctx.runQuery(
      internal.pushSubscriptions.getByUserIdInternal,
      { userId: args.userId }
    );

    if (!subs || subs.length === 0) return;

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      icon: "/icons/icon-192.png",
      url: args.url || "/dashboard",
      type: args.type || "general",
      jobId: args.jobId,
      tag: args.tag || `hirfati-${Date.now()}`,
    });

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
        } catch (error: any) {
          // If subscription is expired/invalid, remove it
          if (error?.statusCode === 410 || error?.statusCode === 404) {
            await ctx.runMutation(
              internal.pushSubscriptions.removeById,
              { id: sub._id }
            );
          }
        }
      })
    );
  },
});

// Notify customer about new quote
export const notifyNewQuote = internalAction({
  args: {
    customerId: v.id("users"),
    providerName: v.string(),
    requestTitle: v.string(),
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.notifications.sendToUser, {
      userId: args.customerId,
      title: "عرض سعر جديد",
      body: `${args.providerName} قدم عرض سعر على "${args.requestTitle}"`,
      url: `/dashboard/requests/${args.requestId}`,
      type: "new_quote",
      jobId: args.requestId,
      tag: `quote-${args.requestId}`,
    });
  },
});

// Notify provider about quote accepted/rejected
export const notifyQuoteResponse = internalAction({
  args: {
    providerId: v.id("users"),
    accepted: v.boolean(),
    requestTitle: v.string(),
    jobId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const title = args.accepted ? "تم قبول عرضك" : "تم رفض عرضك";
    const body = args.accepted
      ? `تهانينا! تم قبول عرضك على "${args.requestTitle}"`
      : `تم رفض عرضك على "${args.requestTitle}"`;

    await ctx.runAction(internal.notifications.sendToUser, {
      userId: args.providerId,
      title,
      body,
      url: args.jobId
        ? `/dashboard/jobs/${args.jobId}`
        : "/dashboard/jobs",
      type: args.accepted ? "quote_accepted" : "quote_rejected",
      jobId: args.jobId,
      tag: `quote-response-${args.jobId || Date.now()}`,
    });
  },
});

// Notify about new chat message
export const notifyNewMessage = internalAction({
  args: {
    recipientId: v.id("users"),
    senderName: v.string(),
    jobId: v.string(),
    preview: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.notifications.sendToUser, {
      userId: args.recipientId,
      title: `رسالة من ${args.senderName}`,
      body: args.preview || "رسالة جديدة",
      url: `/dashboard/jobs/${args.jobId}`,
      type: "new_message",
      jobId: args.jobId,
      tag: `message-${args.jobId}`,
    });
  },
});

// Notify about job status change
export const notifyJobStatusChange = internalAction({
  args: {
    recipientId: v.id("users"),
    jobTitle: v.string(),
    newStatus: v.string(),
    jobId: v.string(),
  },
  handler: async (ctx, args) => {
    const statusLabels: Record<string, string> = {
      in_progress: "قيد التنفيذ",
      completed: "مكتملة",
      confirmed: "تم التأكيد",
      cancelled: "ملغاة",
      disputed: "متنازع عليها",
      accepted: "مقبولة",
    };

    const statusLabel = statusLabels[args.newStatus] || args.newStatus;

    await ctx.runAction(internal.notifications.sendToUser, {
      userId: args.recipientId,
      title: "تحديث المهمة",
      body: `المهمة "${args.jobTitle}" أصبحت ${statusLabel}`,
      url: `/dashboard/jobs/${args.jobId}`,
      type: "job_status_change",
      jobId: args.jobId,
      tag: `job-${args.jobId}`,
    });
  },
});
