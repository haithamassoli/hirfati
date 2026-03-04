import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";

// Submit a quote on a request (one per provider per request)
export const submit = mutation({
  args: {
    requestId: v.id("requests"),
    price: v.number(),
    estimatedDuration: v.string(),
    message: v.string(),
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
    if (!user.isProvider) throw new ConvexError("يجب أن تكون حرفياً لتقديم عرض سعر");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new ConvexError("الطلب غير موجود");
    if (request.status !== "open") throw new ConvexError("الطلب لم يعد مفتوحاً");
    if (request.customerId === user._id)
      throw new ConvexError("لا يمكنك تقديم عرض على طلبك");

    // Check if already quoted
    const existing = await ctx.db
      .query("quotes")
      .withIndex("by_requestId_providerId", (q) =>
        q.eq("requestId", args.requestId).eq("providerId", user._id)
      )
      .first();
    if (existing && existing.status !== "withdrawn")
      throw new ConvexError("لقد قدمت عرضاً على هذا الطلب بالفعل");

    const quoteId = await ctx.db.insert("quotes", {
      requestId: args.requestId,
      providerId: user._id,
      price: args.price,
      estimatedDuration: args.estimatedDuration,
      message: args.message,
      status: "pending",
    });

    // Notify customer about new quote
    await ctx.scheduler.runAfter(0, internal.notifications.notifyNewQuote, {
      customerId: request.customerId,
      providerName: user.name,
      requestTitle: request.title,
      requestId: args.requestId,
    });

    return quoteId;
  },
});

// Withdraw a quote (provider only, only pending quotes)
export const withdraw = mutation({
  args: {
    quoteId: v.id("quotes"),
  },
  returns: v.any(),
  handler: async (ctx, { quoteId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new ConvexError("المستخدم غير موجود");

    const quote = await ctx.db.get(quoteId);
    if (!quote) throw new ConvexError("العرض غير موجود");
    if (quote.providerId !== user._id)
      throw new ConvexError("غير مصرح بسحب هذا العرض");
    if (quote.status !== "pending")
      throw new ConvexError("لا يمكن سحب هذا العرض");

    await ctx.db.patch(quoteId, { status: "withdrawn" });

    return { success: true };
  },
});

// Accept a quote (customer only) — creates a job
export const accept = mutation({
  args: {
    quoteId: v.id("quotes"),
  },
  returns: v.any(),
  handler: async (ctx, { quoteId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new ConvexError("المستخدم غير موجود");

    const quote = await ctx.db.get(quoteId);
    if (!quote) throw new ConvexError("العرض غير موجود");
    if (quote.status !== "pending")
      throw new ConvexError("العرض لم يعد في حالة انتظار");

    const request = await ctx.db.get(quote.requestId);
    if (!request) throw new ConvexError("الطلب غير موجود");
    if (request.customerId !== user._id)
      throw new ConvexError("غير مصرح بقبول هذا العرض");
    if (request.status !== "open")
      throw new ConvexError("الطلب لم يعد مفتوحاً");

    // Accept this quote
    await ctx.db.patch(quoteId, { status: "accepted" });

    // Reject all other pending quotes on this request
    const otherQuotes = await ctx.db
      .query("quotes")
      .withIndex("by_requestId", (q) => q.eq("requestId", quote.requestId))
      .collect();

    for (const other of otherQuotes) {
      if (other._id !== quoteId && other.status === "pending") {
        await ctx.db.patch(other._id, { status: "rejected" });
      }
    }

    // Mark request as assigned
    await ctx.db.patch(quote.requestId, { status: "assigned" });

    // Create a job
    const jobId = await ctx.db.insert("jobs", {
      requestId: quote.requestId,
      quoteId: quoteId,
      customerId: user._id,
      providerId: quote.providerId,
      title: request.title,
      description: request.description,
      price: quote.price,
      status: "accepted",
      statusHistory: [
        {
          status: "accepted",
          timestamp: Date.now(),
          by: user._id,
        },
      ],
      isDirectHire: false,
    });

    // Notify provider about accepted quote
    await ctx.scheduler.runAfter(0, internal.notifications.notifyQuoteResponse, {
      providerId: quote.providerId,
      accepted: true,
      requestTitle: request.title,
      jobId: jobId,
    });

    return jobId;
  },
});

// Reject a quote (customer only)
export const reject = mutation({
  args: {
    quoteId: v.id("quotes"),
  },
  returns: v.any(),
  handler: async (ctx, { quoteId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) throw new ConvexError("المستخدم غير موجود");

    const quote = await ctx.db.get(quoteId);
    if (!quote) throw new ConvexError("العرض غير موجود");
    if (quote.status !== "pending")
      throw new ConvexError("العرض لم يعد في حالة انتظار");

    const request = await ctx.db.get(quote.requestId);
    if (!request) throw new ConvexError("الطلب غير موجود");
    if (request.customerId !== user._id)
      throw new ConvexError("غير مصرح برفض هذا العرض");

    await ctx.db.patch(quoteId, { status: "rejected" });

    // Notify provider about rejected quote
    await ctx.scheduler.runAfter(0, internal.notifications.notifyQuoteResponse, {
      providerId: quote.providerId,
      accepted: false,
      requestTitle: request.title,
    });

    return { success: true };
  },
});

// List quotes by provider
export const listByProvider = query({
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

    const quotes = await ctx.db
      .query("quotes")
      .withIndex("by_providerId", (q) => q.eq("providerId", user._id))
      .collect();

    const enriched = await Promise.all(
      quotes.map(async (quote) => {
        const request = await ctx.db.get(quote.requestId);
        const category = request
          ? await ctx.db.get(request.categoryId)
          : null;
        return {
          ...quote,
          requestTitle: request?.title ?? "",
          requestCity: request?.city,
          categoryNameAr: category?.nameAr ?? "",
        };
      })
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});
