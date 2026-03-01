import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Check if a provider has an active premium subscription
export const getActiveStatus = query({
  args: { providerId: v.optional(v.id("users")) },
  handler: async (ctx, { providerId }) => {
    if (!providerId) return null;

    const now = Date.now();
    const orders = await ctx.db
      .query("premium_orders")
      .withIndex("by_providerId", (q) => q.eq("providerId", providerId))
      .collect();

    const activeOrder = orders.find(
      (o) => o.status === "active" && o.endDate > now
    );

    if (!activeOrder) return null;

    return {
      _id: activeOrder._id,
      type: activeOrder.type,
      startDate: activeOrder.startDate,
      endDate: activeOrder.endDate,
      daysRemaining: Math.ceil((activeOrder.endDate - now) / (1000 * 60 * 60 * 24)),
    };
  },
});

// Get current user's premium status and order history
export const getMyPremiumInfo = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return null;

    const now = Date.now();
    const orders = await ctx.db
      .query("premium_orders")
      .withIndex("by_providerId", (q) => q.eq("providerId", user._id))
      .collect();

    // Sort by creation time desc
    orders.sort((a, b) => b._creationTime - a._creationTime);

    const activeOrder = orders.find(
      (o) => o.status === "active" && o.endDate > now
    );

    return {
      isActive: !!activeOrder,
      activeOrder: activeOrder
        ? {
            _id: activeOrder._id,
            type: activeOrder.type,
            startDate: activeOrder.startDate,
            endDate: activeOrder.endDate,
            daysRemaining: Math.ceil(
              (activeOrder.endDate - now) / (1000 * 60 * 60 * 24)
            ),
          }
        : null,
      orderHistory: orders.map((o) => ({
        _id: o._id,
        type: o.type,
        duration: o.duration,
        startDate: o.startDate,
        endDate: o.endDate,
        status: o.status,
        _creationTime: o._creationTime,
      })),
    };
  },
});

// Create a premium order (manual activation by admin for MVP)
export const createOrder = mutation({
  args: {
    type: v.union(v.literal("ad"), v.literal("visibility_boost")),
    duration: v.union(v.literal(7), v.literal(30)),
  },
  handler: async (ctx, { type, duration }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new Error("المستخدم غير موجود");
    if (!user.isProvider) throw new Error("هذه الخدمة متاحة فقط للحرفيين");

    // Check for existing active order of same type
    const now = Date.now();
    const existingOrders = await ctx.db
      .query("premium_orders")
      .withIndex("by_providerId", (q) => q.eq("providerId", user._id))
      .collect();

    const hasActive = existingOrders.some(
      (o) => o.type === type && o.status === "active" && o.endDate > now
    );
    if (hasActive) {
      throw new Error("لديك اشتراك نشط من نفس النوع بالفعل");
    }

    // Create order as "pending" — admin will activate manually for MVP
    const orderId = await ctx.db.insert("premium_orders", {
      providerId: user._id,
      type,
      duration,
      startDate: 0, // Set when activated
      endDate: 0, // Set when activated
      status: "pending",
    });

    return orderId;
  },
});

// Admin activation of a premium order
export const activateOrder = mutation({
  args: {
    orderId: v.id("premium_orders"),
  },
  handler: async (ctx, { orderId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const order = await ctx.db.get(orderId);
    if (!order) throw new Error("الطلب غير موجود");
    if (order.status !== "pending") throw new Error("الطلب ليس في حالة انتظار");

    const now = Date.now();
    const endDate = now + order.duration * 24 * 60 * 60 * 1000;

    await ctx.db.patch(orderId, {
      startDate: now,
      endDate,
      status: "active",
    });

    // Update user's isPremium flag
    await ctx.db.patch(order.providerId, {
      isPremium: true,
    });

    return { success: true };
  },
});

// Internal mutation to expire premium orders (called by cron)
export const expireOrders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all active orders that have passed their end date
    const activeOrders = await ctx.db
      .query("premium_orders")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const expiredOrders = activeOrders.filter((o) => o.endDate <= now);

    for (const order of expiredOrders) {
      // Mark order as expired
      await ctx.db.patch(order._id, { status: "expired" });

      // Check if provider has any other active orders
      const otherActive = await ctx.db
        .query("premium_orders")
        .withIndex("by_providerId", (q) => q.eq("providerId", order.providerId))
        .collect();

      const stillHasActive = otherActive.some(
        (o) =>
          o._id !== order._id && o.status === "active" && o.endDate > now
      );

      // If no more active orders, remove isPremium flag
      if (!stillHasActive) {
        await ctx.db.patch(order.providerId, { isPremium: false });
      }
    }

    return { expired: expiredOrders.length };
  },
});

// Query to get premium providers for ad banners
export const getPremiumProviders = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { categoryId, limit = 4 }) => {
    const now = Date.now();

    // Get active premium orders
    const activeOrders = await ctx.db
      .query("premium_orders")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const validOrders = activeOrders.filter((o) => o.endDate > now);

    // Get unique provider IDs
    const providerIds = [...new Set(validOrders.map((o) => o.providerId))];

    // Fetch provider details
    const providers = await Promise.all(
      providerIds.map(async (id) => {
        const provider = await ctx.db.get(id);
        if (!provider || !provider.isProvider || !provider.isProfileComplete)
          return null;

        // Filter by category if specified
        if (
          categoryId &&
          (!provider.tradeCategories ||
            !provider.tradeCategories.includes(categoryId))
        ) {
          return null;
        }

        // Get reviews for rating
        const reviews = await ctx.db
          .query("reviews")
          .withIndex("by_providerId", (q) => q.eq("providerId", id))
          .collect();

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        // Get avatar URL
        const avatarUrl = provider.avatarStorageId
          ? await ctx.storage.getUrl(provider.avatarStorageId)
          : provider.avatarUrl;

        // Get order type
        const providerOrder = validOrders.find(
          (o) => o.providerId === id
        );

        return {
          _id: provider._id,
          name: provider.name,
          avatarUrl: avatarUrl ?? undefined,
          bio: provider.bio,
          serviceArea: provider.serviceArea,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
          premiumType: providerOrder?.type,
        };
      })
    );

    return providers.filter(Boolean).slice(0, limit);
  },
});
