import { query } from "./_generated/server";

// Dashboard summary data for the authenticated user
export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return null;

    // ── Jobs ──
    const customerJobs = await ctx.db
      .query("jobs")
      .withIndex("by_customerId", (q) => q.eq("customerId", user._id))
      .collect();

    const providerJobs = await ctx.db
      .query("jobs")
      .withIndex("by_providerId", (q) => q.eq("providerId", user._id))
      .collect();

    // Combine and deduplicate
    const jobMap = new Map<string, (typeof customerJobs)[0]>();
    for (const j of [...customerJobs, ...providerJobs]) {
      jobMap.set(j._id, j);
    }
    const allJobs = Array.from(jobMap.values());

    const activeStatuses = [
      "requested",
      "quoted",
      "accepted",
      "in_progress",
      "completed",
    ];
    const activeJobs = allJobs.filter((j) => activeStatuses.includes(j.status));
    const completedJobs = allJobs.filter(
      (j) => j.status === "confirmed" || j.status === "reviewed"
    );

    // ── Requests (customer) ──
    const myRequests = await ctx.db
      .query("requests")
      .withIndex("by_customerId", (q) => q.eq("customerId", user._id))
      .collect();
    const openRequests = myRequests.filter((r) => r.status === "open");

    // ── Quotes ──
    // Pending quotes on MY requests (customer view)
    let pendingQuotesOnMyRequests = 0;
    for (const req of openRequests) {
      const quotes = await ctx.db
        .query("quotes")
        .withIndex("by_requestId", (q) => q.eq("requestId", req._id))
        .collect();
      pendingQuotesOnMyRequests += quotes.filter(
        (q) => q.status === "pending"
      ).length;
    }

    // My pending quotes (provider view)
    const myQuotes = await ctx.db
      .query("quotes")
      .withIndex("by_providerId", (q) => q.eq("providerId", user._id))
      .collect();
    const myPendingQuotes = myQuotes.filter((q) => q.status === "pending");

    // ── Messages (unread approximation — count messages in active jobs not sent by user) ──
    let unreadMessages = 0;
    for (const job of activeJobs.slice(0, 10)) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_jobId", (q) => q.eq("jobId", job._id))
        .collect();
      // Count messages from other party in last 24 hours as "new"
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      unreadMessages += messages.filter(
        (m) => m.senderId !== user._id && m._creationTime > oneDayAgo
      ).length;
    }

    // ── Services (provider) ──
    const services = await ctx.db
      .query("services")
      .withIndex("by_providerId", (q) => q.eq("providerId", user._id))
      .collect();
    const activeServices = services.filter((s) => s.isActive);

    // ── Reviews ──
    const reviewsReceived = await ctx.db
      .query("reviews")
      .withIndex("by_providerId", (q) => q.eq("providerId", user._id))
      .collect();
    const reviewsGiven = await ctx.db
      .query("reviews")
      .withIndex("by_reviewerId", (q) => q.eq("reviewerId", user._id))
      .collect();

    const avgRating =
      reviewsReceived.length > 0
        ? Math.round(
            (reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
              reviewsReceived.length) *
              10
          ) / 10
        : 0;

    // ── New matching requests (provider view) ──
    let newMatchingRequests = 0;
    if (user.isProvider && user.isProfileComplete) {
      const openReqs = await ctx.db
        .query("requests")
        .withIndex("by_status", (q) => q.eq("status", "open"))
        .collect();

      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      newMatchingRequests = openReqs.filter((r) => {
        const cityMatch =
          !user.serviceArea ||
          user.serviceArea.length === 0 ||
          user.serviceArea.includes(r.city);
        const categoryMatch =
          !user.tradeCategories ||
          user.tradeCategories.length === 0 ||
          user.tradeCategories.includes(r.categoryId);
        const isRecent = r._creationTime > threeDaysAgo;
        return cityMatch && categoryMatch && isRecent;
      }).length;
    }

    // ── Recent activity (last 5 jobs sorted by last status change) ──
    const recentJobs = allJobs
      .sort((a, b) => {
        const aLast = a.statusHistory[a.statusHistory.length - 1]?.timestamp ?? a._creationTime;
        const bLast = b.statusHistory[b.statusHistory.length - 1]?.timestamp ?? b._creationTime;
        return bLast - aLast;
      })
      .slice(0, 5);

    const recentActivity = await Promise.all(
      recentJobs.map(async (job) => {
        const otherUserId =
          job.customerId === user._id ? job.providerId : job.customerId;
        const otherUser = await ctx.db.get(otherUserId);
        const otherAvatarUrl = otherUser?.avatarStorageId
          ? await ctx.storage.getUrl(otherUser.avatarStorageId)
          : otherUser?.avatarUrl;

        return {
          _id: job._id,
          title: job.title,
          status: job.status,
          lastUpdate:
            job.statusHistory[job.statusHistory.length - 1]?.timestamp ??
            job._creationTime,
          otherPartyName: otherUser?.name ?? "مستخدم",
          otherPartyAvatar: otherAvatarUrl ?? undefined,
          role:
            job.customerId === user._id
              ? ("customer" as const)
              : ("provider" as const),
          price: job.price,
        };
      })
    );

    return {
      // Counts
      activeJobsCount: activeJobs.length,
      completedJobsCount: completedJobs.length,
      totalJobsCount: allJobs.length,
      openRequestsCount: openRequests.length,
      totalRequestsCount: myRequests.length,
      pendingQuotesOnMyRequests,
      myPendingQuotesCount: myPendingQuotes.length,
      unreadMessages,
      activeServicesCount: activeServices.length,
      totalServicesCount: services.length,
      reviewsReceivedCount: reviewsReceived.length,
      reviewsGivenCount: reviewsGiven.length,
      avgRating,
      newMatchingRequests,
      // Recent activity
      recentActivity,
      // User info
      isProvider: user.isProvider,
      isProfileComplete: user.isProfileComplete ?? false,
    };
  },
});
