import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getOptionalAuthUser, requireAuthUser } from "./lib/auth";

// Save a push subscription for the current user
export const save = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { endpoint, p256dh, auth }) => {
    const user = await requireAuthUser(ctx);

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
  returns: v.any(),
  handler: async (ctx, { endpoint }) => {
    const user = await requireAuthUser(ctx);

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
  returns: v.any(),
  handler: async (ctx) => {
    const user = await getOptionalAuthUser(ctx);
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
  returns: v.any(),
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
  returns: v.any(),
  handler: async (ctx, { id }) => {
    const sub = await ctx.db.get(id);
    if (sub) {
      await ctx.db.delete(id);
    }
  },
});
