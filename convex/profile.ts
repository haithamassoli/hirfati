import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return null;

    // Get portfolio image URLs
    const portfolio = user.portfolio
      ? await Promise.all(
          user.portfolio.map(async (item) => ({
            ...item,
            url: await ctx.storage.getUrl(item.imageStorageId),
          }))
        )
      : [];

    // Get trade category details
    const tradeCategories = user.tradeCategories
      ? await Promise.all(
          user.tradeCategories.map(async (catId) => {
            const cat = await ctx.db.get(catId);
            return cat ? { _id: cat._id, name: cat.name, nameAr: cat.nameAr, slug: cat.slug } : null;
          })
        )
      : [];

    // Get avatar URL
    const avatarUrl = user.avatarStorageId
      ? await ctx.storage.getUrl(user.avatarStorageId)
      : user.avatarUrl;

    return {
      ...user,
      avatarUrl: avatarUrl ?? undefined,
      portfolio,
      tradeCategoryDetails: tradeCategories.filter(Boolean),
    };
  },
});

export const updateProfile = mutation({
  args: {
    name: v.string(),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    isProvider: v.boolean(),
    tradeCategories: v.optional(v.array(v.id("categories"))),
    serviceArea: v.optional(
      v.array(
        v.union(
          v.literal("amman"),
          v.literal("irbid"),
          v.literal("zarqa")
        )
      )
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new ConvexError("المستخدم غير موجود");

    // Determine if profile is complete for providers
    const isProfileComplete =
      args.isProvider &&
      args.name.length > 0 &&
      (args.bio?.length ?? 0) > 0 &&
      (args.tradeCategories?.length ?? 0) > 0 &&
      (args.serviceArea?.length ?? 0) > 0;

    await ctx.db.patch(user._id, {
      name: args.name,
      bio: args.bio,
      phone: args.phone,
      isProvider: args.isProvider,
      role: args.isProvider ? "provider" : "customer",
      tradeCategories: args.tradeCategories,
      serviceArea: args.serviceArea,
      isProfileComplete,
    });

    return { success: true };
  },
});

// Toggle role between customer and provider (for dashboard view switching)
export const toggleRole = mutation({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new ConvexError("المستخدم غير موجود");

    const newIsProvider = !user.isProvider;

    // Recalculate profile completeness
    const isProfileComplete =
      newIsProvider &&
      user.name.length > 0 &&
      (user.bio?.length ?? 0) > 0 &&
      (user.tradeCategories?.length ?? 0) > 0 &&
      (user.serviceArea?.length ?? 0) > 0;

    await ctx.db.patch(user._id, {
      isProvider: newIsProvider,
      role: newIsProvider ? "provider" : "customer",
      isProfileComplete,
    });

    return { success: true, isProvider: newIsProvider };
  },
});

export const updateAvatar = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.any(),
  handler: async (ctx, { storageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new ConvexError("المستخدم غير موجود");

    // Delete old avatar from storage if it exists
    if (user.avatarStorageId) {
      await ctx.storage.delete(user.avatarStorageId);
    }

    const url = await ctx.storage.getUrl(storageId);

    await ctx.db.patch(user._id, {
      avatarStorageId: storageId,
      avatarUrl: url ?? undefined,
    });

    return { success: true, url };
  },
});

export const addPortfolioImage = mutation({
  args: {
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, { storageId, caption }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new ConvexError("المستخدم غير موجود");

    const portfolio = user.portfolio ?? [];
    portfolio.push({ imageStorageId: storageId, caption });

    await ctx.db.patch(user._id, { portfolio });

    return { success: true };
  },
});

export const updatePortfolioCaption = mutation({
  args: {
    imageStorageId: v.id("_storage"),
    caption: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { imageStorageId, caption }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new ConvexError("المستخدم غير موجود");

    const portfolio = (user.portfolio ?? []).map((item) =>
      item.imageStorageId === imageStorageId ? { ...item, caption } : item
    );

    await ctx.db.patch(user._id, { portfolio });

    return { success: true };
  },
});

export const deletePortfolioImage = mutation({
  args: {
    imageStorageId: v.id("_storage"),
  },
  returns: v.any(),
  handler: async (ctx, { imageStorageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new ConvexError("المستخدم غير موجود");

    const portfolio = (user.portfolio ?? []).filter(
      (item) => item.imageStorageId !== imageStorageId
    );

    await ctx.storage.delete(imageStorageId);
    await ctx.db.patch(user._id, { portfolio });

    return { success: true };
  },
});

export const reorderPortfolio = mutation({
  args: {
    orderedStorageIds: v.array(v.id("_storage")),
  },
  returns: v.any(),
  handler: async (ctx, { orderedStorageIds }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new ConvexError("المستخدم غير موجود");

    const portfolioMap = new Map(
      (user.portfolio ?? []).map((item) => [item.imageStorageId, item])
    );

    const reordered = orderedStorageIds
      .map((id) => portfolioMap.get(id))
      .filter(Boolean) as { imageStorageId: typeof orderedStorageIds[number]; caption?: string }[];

    await ctx.db.patch(user._id, { portfolio: reordered });

    return { success: true };
  },
});
