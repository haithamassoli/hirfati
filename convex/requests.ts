import { query } from "./_generated/server";
import { v } from "convex/values";

export const listOpen = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    city: v.optional(
      v.union(v.literal("amman"), v.literal("irbid"), v.literal("zarqa"))
    ),
  },
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

export const getById = query({
  args: { id: v.id("requests") },
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
