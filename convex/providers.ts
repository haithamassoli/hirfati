import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    city: v.optional(
      v.union(v.literal("amman"), v.literal("irbid"), v.literal("zarqa"))
    ),
  },
  returns: v.any(),
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

    // Get all active premium orders for priority ranking
    const now = Date.now();
    const activePremiumOrders = await ctx.db
      .query("premium_orders")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const premiumProviderIds = new Set(
      activePremiumOrders
        .filter((o) => o.endDate > now)
        .map((o) => o.providerId)
    );

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

        const hasPremium =
          provider.isPremium || premiumProviderIds.has(provider._id);

        // Compute price range from active services
        const prices = activeServices
          .filter((s) => s.price > 0)
          .map((s) => s.price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        return {
          ...provider,
          isPremium: hasPremium,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
          serviceCount: activeServices.length,
          minPrice,
          maxPrice,
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

export const search = query({
  args: {
    term: v.string(),
    city: v.optional(
      v.union(v.literal("amman"), v.literal("irbid"), v.literal("zarqa"))
    ),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, { term, city, limit }) => {
    const maxResults = limit ?? 20;

    // 1. Search users by name using the search index
    let userResults = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (q) => {
        const sq = q.search("name", term);
        return sq.eq("isProvider", true);
      })
      .take(maxResults);

    // Filter by city in JS (serviceArea is an array, not a scalar)
    if (city) {
      userResults = userResults.filter(
        (u) => u.serviceArea && u.serviceArea.includes(city)
      );
    }

    // Only complete profiles
    userResults = userResults.filter((u) => u.isProfileComplete);

    // 2. Also search services by title to find providers with matching services
    const serviceResults = await ctx.db
      .query("services")
      .withSearchIndex("search_title", (q) => {
        return q.search("title", term).eq("isActive", true);
      })
      .take(50);

    // Get unique provider IDs from service matches
    const existingIds = new Set(userResults.map((u) => u._id));
    const additionalProviderIds = [
      ...new Set(serviceResults.map((s) => s.providerId)),
    ].filter((id) => !existingIds.has(id));

    // Fetch additional providers from service matches
    const additionalProviders = (
      await Promise.all(additionalProviderIds.map((id) => ctx.db.get(id)))
    ).filter(
      (p): p is NonNullable<typeof p> =>
        p !== null &&
        p.isProvider &&
        !!p.isProfileComplete &&
        (!city || (p.serviceArea ? p.serviceArea.includes(city) : false))
    );

    const allProviders = [...userResults, ...additionalProviders].slice(
      0,
      maxResults
    );

    // Enrich with ratings, services, premium status
    const now = Date.now();
    const activePremiumOrders = await ctx.db
      .query("premium_orders")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const premiumProviderIds = new Set(
      activePremiumOrders
        .filter((o) => o.endDate > now)
        .map((o) => o.providerId)
    );

    const enriched = await Promise.all(
      allProviders.map(async (provider) => {
        const reviews = await ctx.db
          .query("reviews")
          .withIndex("by_providerId", (q) =>
            q.eq("providerId", provider._id)
          )
          .collect();
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        const services = await ctx.db
          .query("services")
          .withIndex("by_providerId", (q) =>
            q.eq("providerId", provider._id)
          )
          .collect();
        const activeServices = services.filter((s) => s.isActive);
        const avatarUrl = provider.avatarStorageId
          ? await ctx.storage.getUrl(provider.avatarStorageId)
          : provider.avatarUrl;

        return {
          _id: provider._id,
          name: provider.name,
          bio: provider.bio,
          avatarUrl: avatarUrl ?? undefined,
          serviceArea: provider.serviceArea,
          isPremium:
            provider.isPremium || premiumProviderIds.has(provider._id),
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
          serviceCount: activeServices.length,
        };
      })
    );

    return enriched.sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return b.avgRating - a.avgRating;
    });
  },
});

export const getById = query({
  args: { id: v.id("users") },
  returns: v.any(),
  handler: async (ctx, { id }) => {
    const provider = await ctx.db.get(id);
    if (!provider || !provider.isProvider) return null;

    // Get reviews
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_providerId", (q) => q.eq("providerId", id))
      .collect();

    // Get reviewer names and avatars
    const reviewsWithReviewer = await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await ctx.db.get(review.reviewerId);
        const reviewerAvatarUrl = reviewer?.avatarStorageId
          ? await ctx.storage.getUrl(reviewer.avatarStorageId)
          : reviewer?.avatarUrl;
        return {
          ...review,
          reviewerName: reviewer?.name ?? "مستخدم",
          reviewerAvatar: reviewerAvatarUrl ?? undefined,
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
  returns: v.any(),
  handler: async (ctx) => {
    const providers = await ctx.db
      .query("users")
      .withIndex("by_isProvider", (q) => q.eq("isProvider", true))
      .collect();

    const complete = providers.filter((p) => p.isProfileComplete);

    // Get active premium orders
    const now = Date.now();
    const activePremiumOrders = await ctx.db
      .query("premium_orders")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const premiumProviderIds = new Set(
      activePremiumOrders
        .filter((o) => o.endDate > now)
        .map((o) => o.providerId)
    );

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

        const avatarUrl = provider.avatarStorageId
          ? await ctx.storage.getUrl(provider.avatarStorageId)
          : provider.avatarUrl;

        const hasPremium =
          provider.isPremium || premiumProviderIds.has(provider._id);

        return {
          _id: provider._id,
          name: provider.name,
          avatarUrl: avatarUrl ?? undefined,
          bio: provider.bio,
          serviceArea: provider.serviceArea,
          isPremium: hasPremium,
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
