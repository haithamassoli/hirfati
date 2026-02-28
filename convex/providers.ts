import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    city: v.optional(
      v.union(v.literal("amman"), v.literal("irbid"), v.literal("zarqa"))
    ),
  },
  handler: async (ctx, { categoryId, city }) => {
    let providers = await ctx.db
      .query("users")
      .withIndex("by_isProvider", (q) => q.eq("isProvider", true))
      .collect();

    // Filter by category if specified
    if (categoryId) {
      providers = providers.filter(
        (p) => p.tradeCategories && p.tradeCategories.includes(categoryId)
      );
    }

    // Filter by city if specified
    if (city) {
      providers = providers.filter(
        (p) => p.serviceArea && p.serviceArea.includes(city)
      );
    }

    // Only show providers with complete profiles
    providers = providers.filter((p) => p.isProfileComplete);

    // Fetch reviews for each provider to compute rating
    const providersWithRating = await Promise.all(
      providers.map(async (provider) => {
        const reviews = await ctx.db
          .query("reviews")
          .withIndex("by_providerId", (q) => q.eq("providerId", provider._id))
          .collect();

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        // Get services count
        const services = await ctx.db
          .query("services")
          .withIndex("by_providerId", (q) => q.eq("providerId", provider._id))
          .collect();
        const activeServices = services.filter((s) => s.isActive);

        return {
          ...provider,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
          serviceCount: activeServices.length,
        };
      })
    );

    // Sort: premium first, then by rating
    return providersWithRating.sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return b.avgRating - a.avgRating;
    });
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const provider = await ctx.db.get(id);
    if (!provider || !provider.isProvider) return null;

    // Get reviews
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_providerId", (q) => q.eq("providerId", id))
      .collect();

    // Get reviewer names
    const reviewsWithReviewer = await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await ctx.db.get(review.reviewerId);
        return {
          ...review,
          reviewerName: reviewer?.name ?? "مستخدم",
          reviewerAvatar: reviewer?.avatarUrl,
        };
      })
    );

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Get active services
    const services = await ctx.db
      .query("services")
      .withIndex("by_providerId", (q) => q.eq("providerId", id))
      .collect();
    const activeServices = services.filter((s) => s.isActive);

    // Get service categories
    const serviceCategories = await Promise.all(
      activeServices.map(async (s) => {
        const cat = await ctx.db.get(s.categoryId);
        return { ...s, categoryName: cat?.nameAr ?? "", categorySlug: cat?.slug ?? "" };
      })
    );

    // Get trade category names
    const tradeCategories = provider.tradeCategories
      ? await Promise.all(
          provider.tradeCategories.map(async (catId) => {
            const cat = await ctx.db.get(catId);
            return cat ? { _id: cat._id, nameAr: cat.nameAr, slug: cat.slug } : null;
          })
        )
      : [];

    // Get portfolio image URLs
    const portfolioWithUrls = provider.portfolio
      ? await Promise.all(
          provider.portfolio.map(async (item) => {
            const url = await ctx.storage.getUrl(item.imageStorageId);
            return { ...item, url };
          })
        )
      : [];

    // Get completed jobs count
    const completedJobs = await ctx.db
      .query("jobs")
      .withIndex("by_providerId", (q) => q.eq("providerId", id))
      .collect();
    const completedCount = completedJobs.filter(
      (j) => j.status === "confirmed" || j.status === "reviewed"
    ).length;

    return {
      ...provider,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
      reviews: reviewsWithReviewer,
      services: serviceCategories,
      tradeCategories: tradeCategories.filter(Boolean),
      portfolio: portfolioWithUrls,
      completedJobs: completedCount,
    };
  },
});

export const listFeatured = query({
  args: {},
  handler: async (ctx) => {
    const providers = await ctx.db
      .query("users")
      .withIndex("by_isProvider", (q) => q.eq("isProvider", true))
      .collect();

    const complete = providers.filter((p) => p.isProfileComplete);

    const withRating = await Promise.all(
      complete.map(async (provider) => {
        const reviews = await ctx.db
          .query("reviews")
          .withIndex("by_providerId", (q) => q.eq("providerId", provider._id))
          .collect();

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return {
          _id: provider._id,
          name: provider.name,
          avatarUrl: provider.avatarUrl,
          bio: provider.bio,
          serviceArea: provider.serviceArea,
          isPremium: provider.isPremium,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
        };
      })
    );

    // Premium first, then by rating, limit to 8
    return withRating
      .sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        return b.avgRating - a.avgRating;
      })
      .slice(0, 8);
  },
});
