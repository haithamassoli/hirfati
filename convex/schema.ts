import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.union(v.literal("customer"), v.literal("provider")),
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
    portfolio: v.optional(
      v.array(
        v.object({
          imageStorageId: v.id("_storage"),
          caption: v.optional(v.string()),
        })
      )
    ),
    isProfileComplete: v.optional(v.boolean()),
    isPremium: v.optional(v.boolean()),
    betterAuthUserId: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_betterAuthUserId", ["betterAuthUserId"])
    .index("by_isProvider", ["isProvider"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["isProvider", "serviceArea"],
    }),

  categories: defineTable({
    name: v.string(),
    nameAr: v.string(),
    slug: v.string(),
    icon: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    parentId: v.optional(v.id("categories")),
    order: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_parentId", ["parentId"])
    .index("by_order", ["order"]),

  services: defineTable({
    providerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    priceType: v.union(v.literal("fixed"), v.literal("flexible")),
    price: v.number(),
    isActive: v.boolean(),
  })
    .index("by_providerId", ["providerId"])
    .index("by_categoryId", ["categoryId"])
    .index("by_isActive", ["isActive"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["categoryId", "isActive"],
    }),

  requests: defineTable({
    customerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    city: v.union(
      v.literal("amman"),
      v.literal("irbid"),
      v.literal("zarqa")
    ),
    budgetMin: v.number(),
    budgetMax: v.number(),
    photos: v.optional(v.array(v.id("_storage"))),
    status: v.union(
      v.literal("open"),
      v.literal("assigned"),
      v.literal("closed")
    ),
  })
    .index("by_customerId", ["customerId"])
    .index("by_categoryId", ["categoryId"])
    .index("by_city", ["city"])
    .index("by_status", ["status"])
    .index("by_city_categoryId", ["city", "categoryId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["categoryId", "city", "status"],
    }),

  quotes: defineTable({
    requestId: v.id("requests"),
    providerId: v.id("users"),
    price: v.number(),
    estimatedDuration: v.string(),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("withdrawn")
    ),
  })
    .index("by_requestId", ["requestId"])
    .index("by_providerId", ["providerId"])
    .index("by_requestId_providerId", ["requestId", "providerId"]),

  jobs: defineTable({
    requestId: v.optional(v.id("requests")),
    quoteId: v.optional(v.id("quotes")),
    customerId: v.id("users"),
    providerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    price: v.number(),
    status: v.union(
      v.literal("requested"),
      v.literal("quoted"),
      v.literal("accepted"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("confirmed"),
      v.literal("reviewed"),
      v.literal("cancelled"),
      v.literal("disputed")
    ),
    statusHistory: v.array(
      v.object({
        status: v.string(),
        timestamp: v.number(),
        by: v.id("users"),
      })
    ),
    isDirectHire: v.boolean(),
  })
    .index("by_customerId", ["customerId"])
    .index("by_providerId", ["providerId"])
    .index("by_status", ["status"])
    .index("by_requestId", ["requestId"]),

  messages: defineTable({
    jobId: v.id("jobs"),
    senderId: v.id("users"),
    content: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
  })
    .index("by_jobId", ["jobId"]),

  reviews: defineTable({
    jobId: v.id("jobs"),
    reviewerId: v.id("users"),
    providerId: v.id("users"),
    rating: v.number(),
    comment: v.string(),
  })
    .index("by_jobId", ["jobId"])
    .index("by_providerId", ["providerId"])
    .index("by_reviewerId", ["reviewerId"]),

  push_subscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  premium_orders: defineTable({
    providerId: v.id("users"),
    type: v.union(v.literal("ad"), v.literal("visibility_boost")),
    duration: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("expired")
    ),
  })
    .index("by_providerId", ["providerId"])
    .index("by_status", ["status"])
    .index("by_endDate", ["endDate"]),
});
