import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByProvider = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    const services = await ctx.db
      .query("services")
      .withIndex("by_providerId", (q) => q.eq("providerId", user._id))
      .collect();

    // Enrich with category names
    return Promise.all(
      services.map(async (service) => {
        const category = await ctx.db.get(service.categoryId);
        return {
          ...service,
          categoryName: category?.nameAr ?? "",
          categorySlug: category?.slug ?? "",
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    priceType: v.union(v.literal("fixed"), v.literal("flexible")),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");
    if (!user.isProvider) throw new Error("يجب أن تكون حرفياً لإضافة خدمة");

    const serviceId = await ctx.db.insert("services", {
      providerId: user._id,
      title: args.title,
      description: args.description,
      categoryId: args.categoryId,
      priceType: args.priceType,
      price: args.price,
      isActive: true,
    });

    return serviceId;
  },
});

export const update = mutation({
  args: {
    id: v.id("services"),
    title: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    priceType: v.union(v.literal("fixed"), v.literal("flexible")),
    price: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const service = await ctx.db.get(args.id);
    if (!service) throw new Error("الخدمة غير موجودة");
    if (service.providerId !== user._id)
      throw new Error("غير مصرح بتعديل هذه الخدمة");

    await ctx.db.patch(args.id, {
      title: args.title,
      description: args.description,
      categoryId: args.categoryId,
      priceType: args.priceType,
      price: args.price,
      isActive: args.isActive,
    });

    return { success: true };
  },
});

export const remove = mutation({
  args: {
    id: v.id("services"),
  },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const service = await ctx.db.get(id);
    if (!service) throw new Error("الخدمة غير موجودة");
    if (service.providerId !== user._id)
      throw new Error("غير مصرح بحذف هذه الخدمة");

    await ctx.db.delete(id);

    return { success: true };
  },
});
