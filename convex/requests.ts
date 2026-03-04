import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const listOpen = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    city: v.optional(
      v.union(v.literal("amman"), v.literal("irbid"), v.literal("zarqa"))
    ),
  },
  returns: v.any(),
  handler: async (ctx, { categoryId, city }) => {
    let requests;

    if (city && categoryId) {
      requests = await ctx.db
        .query("requests")
        .withIndex("by_city_categoryId", (q) =>
          q.eq("city", city).eq("categoryId", categoryId)
        )
        .collect();
      requests = requests.filter((r) => r.status === "open");
    } else if (city) {
      requests = await ctx.db
        .query("requests")
        .withIndex("by_city", (q) => q.eq("city", city))
        .collect();
      requests = requests.filter((r) => r.status === "open");
    } else if (categoryId) {
      requests = await ctx.db
        .query("requests")
        .withIndex("by_categoryId", (q) => q.eq("categoryId", categoryId))
        .collect();
      requests = requests.filter((r) => r.status === "open");
    } else {
      requests = await ctx.db
        .query("requests")
        .withIndex("by_status", (q) => q.eq("status", "open"))
        .collect();
    }

    // Enrich with category and customer info, quote count
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const category = await ctx.db.get(req.categoryId);
        const customer = await ctx.db.get(req.customerId);
        const quotes = await ctx.db
          .query("quotes")
          .withIndex("by_requestId", (q) => q.eq("requestId", req._id))
          .collect();

        // Get photo URLs
        const photoUrls = req.photos
          ? await Promise.all(
              req.photos.map(async (id) => await ctx.storage.getUrl(id))
            )
          : [];

        return {
          ...req,
          categoryNameAr: category?.nameAr ?? "",
          categorySlug: category?.slug ?? "",
          customerName: customer?.name ?? "مستخدم",
          quoteCount: quotes.filter((q) => q.status === "pending").length,
          photoUrls: photoUrls.filter(Boolean) as string[],
        };
      })
    );

    // Sort by newest first
    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// List requests by the current authenticated customer
export const listByCustomer = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return [];

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_customerId", (q) => q.eq("customerId", user._id))
      .collect();

    const enriched = await Promise.all(
      requests.map(async (req) => {
        const category = await ctx.db.get(req.categoryId);
        const quotes = await ctx.db
          .query("quotes")
          .withIndex("by_requestId", (q) => q.eq("requestId", req._id))
          .collect();

        return {
          ...req,
          categoryNameAr: category?.nameAr ?? "",
          categorySlug: category?.slug ?? "",
          quoteCount: quotes.filter((q) => q.status === "pending").length,
          totalQuotes: quotes.length,
        };
      })
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// List open requests matching provider's profile (city & categories)
export const listForProvider = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    city: v.optional(
      v.union(v.literal("amman"), v.literal("irbid"), v.literal("zarqa"))
    ),
  },
  returns: v.any(),
  handler: async (ctx, { categoryId, city }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user || !user.isProvider) return [];

    // Get open requests
    let requests = await ctx.db
      .query("requests")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    // Filter by provider's service area if no specific city filter
    if (city) {
      requests = requests.filter((r) => r.city === city);
    } else if (user.serviceArea && user.serviceArea.length > 0) {
      requests = requests.filter((r) => user.serviceArea!.includes(r.city));
    }

    // Filter by provider's categories if no specific category filter
    if (categoryId) {
      requests = requests.filter((r) => r.categoryId === categoryId);
    } else if (user.tradeCategories && user.tradeCategories.length > 0) {
      requests = requests.filter((r) =>
        user.tradeCategories!.includes(r.categoryId)
      );
    }

    const enriched = await Promise.all(
      requests.map(async (req) => {
        const category = await ctx.db.get(req.categoryId);
        const customer = await ctx.db.get(req.customerId);
        const quotes = await ctx.db
          .query("quotes")
          .withIndex("by_requestId", (q) => q.eq("requestId", req._id))
          .collect();

        // Check if provider already quoted
        const myQuote = quotes.find((q) => q.providerId === user._id);

        const photoUrls = req.photos
          ? await Promise.all(
              req.photos.map(async (id) => await ctx.storage.getUrl(id))
            )
          : [];

        return {
          ...req,
          categoryNameAr: category?.nameAr ?? "",
          categorySlug: category?.slug ?? "",
          customerName: customer?.name ?? "مستخدم",
          quoteCount: quotes.filter((q) => q.status === "pending").length,
          hasQuoted: !!myQuote,
          myQuoteStatus: myQuote?.status,
          photoUrls: photoUrls.filter(Boolean) as string[],
        };
      })
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const search = query({
  args: {
    term: v.string(),
    city: v.optional(
      v.union(v.literal("amman"), v.literal("irbid"), v.literal("zarqa"))
    ),
    categoryId: v.optional(v.id("categories")),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, { term, city, categoryId, limit }) => {
    const maxResults = limit ?? 20;

    const results = await ctx.db
      .query("requests")
      .withSearchIndex("search_title", (q) => {
        let sq = q.search("title", term).eq("status", "open");
        if (city) sq = sq.eq("city", city);
        if (categoryId) sq = sq.eq("categoryId", categoryId);
        return sq;
      })
      .take(maxResults);

    const enriched = await Promise.all(
      results.map(async (req) => {
        const category = await ctx.db.get(req.categoryId);
        const customer = await ctx.db.get(req.customerId);
        const quotes = await ctx.db
          .query("quotes")
          .withIndex("by_requestId", (q) => q.eq("requestId", req._id))
          .collect();

        const photoUrls = req.photos
          ? await Promise.all(
              req.photos.map(async (id) => await ctx.storage.getUrl(id))
            )
          : [];

        return {
          ...req,
          categoryNameAr: category?.nameAr ?? "",
          categorySlug: category?.slug ?? "",
          customerName: customer?.name ?? "مستخدم",
          quoteCount: quotes.filter((q) => q.status === "pending").length,
          photoUrls: photoUrls.filter(Boolean) as string[],
        };
      })
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Create a service request
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    city: v.union(v.literal("amman"), v.literal("irbid"), v.literal("zarqa")),
    budgetMin: v.number(),
    budgetMax: v.number(),
    photos: v.optional(v.array(v.id("_storage"))),
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

    const requestId = await ctx.db.insert("requests", {
      customerId: user._id,
      title: args.title,
      description: args.description,
      categoryId: args.categoryId,
      city: args.city,
      budgetMin: args.budgetMin,
      budgetMax: args.budgetMax,
      photos: args.photos,
      status: "open",
    });

    return requestId;
  },
});

// Get request detail with quotes (for customer - shows all quotes with provider info)
export const getDetailForCustomer = query({
  args: { id: v.id("requests") },
  returns: v.any(),
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return null;

    const request = await ctx.db.get(id);
    if (!request) return null;

    const isOwner = request.customerId === user._id;
    const isProvider = user.isProvider;

    const category = await ctx.db.get(request.categoryId);
    const customer = await ctx.db.get(request.customerId);

    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_requestId", (q) => q.eq("requestId", id))
      .collect();

    // Enrich quotes with provider info
    const enrichedQuotes = await Promise.all(
      quotes.map(async (quote) => {
        const provider = await ctx.db.get(quote.providerId);
        const avatarUrl = provider?.avatarStorageId
          ? await ctx.storage.getUrl(provider.avatarStorageId)
          : provider?.avatarUrl;
        return {
          ...quote,
          providerName: provider?.name ?? "حرفي",
          providerAvatar: avatarUrl ?? undefined,
          providerBio: provider?.bio,
        };
      })
    );

    const photoUrls = request.photos
      ? await Promise.all(
          request.photos.map(async (storageId) => await ctx.storage.getUrl(storageId))
        )
      : [];

    // Check if the current user (provider) already submitted a quote
    const myQuote = isProvider
      ? quotes.find((q) => q.providerId === user._id)
      : null;

    return {
      ...request,
      categoryNameAr: category?.nameAr ?? "",
      categorySlug: category?.slug ?? "",
      customerName: customer?.name ?? "مستخدم",
      customerAvatar: customer?.avatarUrl,
      photoUrls: photoUrls.filter(Boolean) as string[],
      quotes: enrichedQuotes,
      isOwner,
      isProvider,
      myQuote: myQuote
        ? { ...myQuote }
        : null,
    };
  },
});

export const getById = query({
  args: { id: v.id("requests") },
  returns: v.any(),
  handler: async (ctx, { id }) => {
    const request = await ctx.db.get(id);
    if (!request) return null;

    const category = await ctx.db.get(request.categoryId);
    const customer = await ctx.db.get(request.customerId);
    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_requestId", (q) => q.eq("requestId", id))
      .collect();

    const photoUrls = request.photos
      ? await Promise.all(
          request.photos.map(async (storageId) => await ctx.storage.getUrl(storageId))
        )
      : [];

    return {
      ...request,
      categoryNameAr: category?.nameAr ?? "",
      categorySlug: category?.slug ?? "",
      categoryIcon: category?.icon ?? "",
      customerName: customer?.name ?? "مستخدم",
      customerAvatar: customer?.avatarUrl,
      quoteCount: quotes.filter((q) => q.status === "pending").length,
      totalQuotes: quotes.length,
      photoUrls: photoUrls.filter(Boolean) as string[],
    };
  },
});
