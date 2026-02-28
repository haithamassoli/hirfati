import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_order")
      .collect();
  },
});

export const listMain = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("categories")
      .withIndex("by_order")
      .collect();
    return all.filter((c) => !c.parentId);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

export const getSubcategories = query({
  args: { parentId: v.id("categories") },
  handler: async (ctx, { parentId }) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_parentId", (q) => q.eq("parentId", parentId))
      .collect();
  },
});
