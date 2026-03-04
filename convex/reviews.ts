import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getOptionalAuthUser, requireAuthUser } from "./lib/auth";

// Submit a review (customer only, after confirmed state, one per job)
export const submit = mutation({
  args: {
    jobId: v.id("jobs"),
    rating: v.number(),
    comment: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { jobId, rating, comment }) => {
    const user = await requireAuthUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job) throw new ConvexError("المهمة غير موجودة");

    // Only customer can review
    if (job.customerId !== user._id) {
      throw new ConvexError("فقط العميل يمكنه تقييم المهمة");
    }

    // Only from confirmed state
    if (job.status !== "confirmed") {
      throw new ConvexError("لا يمكن التقييم إلا بعد تأكيد اكتمال المهمة");
    }

    // Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new ConvexError("التقييم يجب أن يكون بين 1 و 5");
    }

    // Check for existing review
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .first();
    if (existingReview) {
      throw new ConvexError("تم تقييم هذه المهمة مسبقاً");
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      throw new ConvexError("يرجى كتابة تعليق");
    }

    // Create review
    const reviewId = await ctx.db.insert("reviews", {
      jobId,
      reviewerId: user._id,
      providerId: job.providerId,
      rating,
      comment: trimmedComment,
    });

    // Transition job to "reviewed"
    await ctx.db.patch(jobId, {
      status: "reviewed",
      statusHistory: [
        ...job.statusHistory,
        {
          status: "reviewed",
          timestamp: Date.now(),
          by: user._id,
        },
      ],
    });

    return reviewId;
  },
});

// Get provider rating stats
export const getProviderStats = query({
  args: { providerId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, { providerId }) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_providerId", (q) => q.eq("providerId", providerId))
      .collect();

    if (reviews.length === 0) {
      return { avgRating: 0, reviewCount: 0, distribution: [0, 0, 0, 0, 0] };
    }

    const avgRating =
      Math.round(
        (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
      ) / 10;

    // Rating distribution (1-5 stars)
    const distribution = [0, 0, 0, 0, 0];
    for (const r of reviews) {
      distribution[r.rating - 1]++;
    }

    return { avgRating, reviewCount: reviews.length, distribution };
  },
});

// List reviews by current user (reviews given by customer, reviews received by provider)
export const listByCurrentUser = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await getOptionalAuthUser(ctx);
    if (!user) return { given: [], received: [] };

    // Reviews given (as reviewer)
    const givenReviews = await ctx.db
      .query("reviews")
      .withIndex("by_reviewerId", (q) => q.eq("reviewerId", user._id))
      .collect();

    const enrichedGiven = await Promise.all(
      givenReviews.map(async (review) => {
        const provider = await ctx.db.get(review.providerId);
        const job = await ctx.db.get(review.jobId);
        const providerAvatarUrl = provider?.avatarStorageId
          ? await ctx.storage.getUrl(provider.avatarStorageId)
          : provider?.avatarUrl;

        return {
          ...review,
          providerName: provider?.name ?? "حرفي",
          providerAvatar: providerAvatarUrl ?? undefined,
          jobTitle: job?.title ?? "",
        };
      })
    );

    // Reviews received (as provider)
    const receivedReviews = await ctx.db
      .query("reviews")
      .withIndex("by_providerId", (q) => q.eq("providerId", user._id))
      .collect();

    const enrichedReceived = await Promise.all(
      receivedReviews.map(async (review) => {
        const reviewer = await ctx.db.get(review.reviewerId);
        const job = await ctx.db.get(review.jobId);
        const reviewerAvatarUrl = reviewer?.avatarStorageId
          ? await ctx.storage.getUrl(reviewer.avatarStorageId)
          : reviewer?.avatarUrl;

        return {
          ...review,
          reviewerName: reviewer?.name ?? "مستخدم",
          reviewerAvatar: reviewerAvatarUrl ?? undefined,
          jobTitle: job?.title ?? "",
        };
      })
    );

    return {
      given: enrichedGiven.sort(
        (a, b) => b._creationTime - a._creationTime
      ),
      received: enrichedReceived.sort(
        (a, b) => b._creationTime - a._creationTime
      ),
    };
  },
});

// Get review for a specific job (to check if already reviewed)
export const getByJob = query({
  args: { jobId: v.id("jobs") },
  returns: v.any(),
  handler: async (ctx, { jobId }) => {
    const review = await ctx.db
      .query("reviews")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .first();

    if (!review) return null;

    const reviewer = await ctx.db.get(review.reviewerId);
    return {
      ...review,
      reviewerName: reviewer?.name ?? "مستخدم",
    };
  },
});
