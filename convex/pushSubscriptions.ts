import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
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

// Save a push subscription for the current user
export const save = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, { endpoint, p256dh, auth }) => {
    const user = await getAuthUser(ctx);

    // Check if subscription already exists
    const existing = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .first();

    if (existing) {
      if (existing.userId === user._id) {
        await ctx.db.patch(existing._id, { p256dh, auth });
        return existing._id;
      }
      await ctx.db.delete(existing._id);
    }

    return await ctx.db.insert("push_subscriptions", {
      userId: user._id,
      endpoint,
      p256dh,
      auth,
    });
  },
});

// Remove a push subscription
export const remove = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, { endpoint }) => {
    const user = await getAuthUser(ctx);

    const existing = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .first();

    if (existing && existing.userId === user._id) {
      await ctx.db.delete(existing._id);
      return { success: true };
    }

    return { success: false };
  },
});

// Check if current user has an active push subscription
export const hasSubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return false;

    const sub = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    return !!sub;
  },
});

// Internal query: get subscriptions for a user (used by notifications action)
export const getByUserIdInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("push_subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Internal mutation: remove a subscription by ID (for expired subs cleanup)
export const removeById = internalMutation({
  args: { id: v.id("push_subscriptions") },
  handler: async (ctx, { id }) => {
    const sub = await ctx.db.get(id);
    if (sub) {
      await ctx.db.delete(id);
    }
  },
});
