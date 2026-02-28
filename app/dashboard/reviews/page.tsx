"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Star, MessageSquareText, Send, Inbox } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "received" | "given";

export default function ReviewsDashboardPage() {
  const data = useQuery(api.reviews.listByCurrentUser);
  const user = useQuery(api.profile.getCurrentUser);
  const [activeTab, setActiveTab] = useState<Tab>(
    user?.isProvider ? "received" : "given"
  );

  if (data === undefined) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs: Array<{ key: Tab; label: string; icon: typeof Star; count: number }> = [
    ...(user?.isProvider
      ? [{ key: "received" as Tab, label: "تقييمات واردة", icon: Inbox, count: data.received.length }]
      : []),
    { key: "given" as Tab, label: "تقييمات أرسلتها", icon: Send, count: data.given.length },
    ...(!user?.isProvider
      ? []
      : [{ key: "given" as Tab, label: "تقييمات أرسلتها", icon: Send, count: data.given.length }]),
  ];

  // Deduplicate tabs
  const uniqueTabs = tabs.filter(
    (tab, index, self) => self.findIndex((t) => t.key === tab.key) === index
  );

  const activeReviews = activeTab === "received" ? data.received : data.given;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">التقييمات</h1>
        <p className="text-neutral-500 text-sm mt-1">
          اطلع على التقييمات المرتبطة بحسابك
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center shrink-0">
              <Star className="h-6 w-6 text-accent-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {data.received.length + data.given.length}
              </p>
              <p className="text-xs text-neutral-500">إجمالي التقييمات</p>
            </div>
          </CardContent>
        </Card>

        {user?.isProvider && data.received.length > 0 && (
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <Inbox className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {(
                    data.received.reduce((s, r) => s + r.rating, 0) /
                    data.received.length
                  ).toFixed(1)}
                </p>
                <p className="text-xs text-neutral-500">متوسط التقييم</p>
              </div>
            </CardContent>
          </Card>
        )}

        {user?.isProvider && (
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <MessageSquareText className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {data.received.length}
                </p>
                <p className="text-xs text-neutral-500">تقييمات واردة</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      {uniqueTabs.length > 1 && (
        <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
          {uniqueTabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                  activeTab === tab.key
                    ? "bg-white text-foreground shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                <TabIcon className="h-4 w-4" />
                {tab.label}
                <Badge
                  variant={activeTab === tab.key ? "primary" : "default"}
                  className="text-[10px] px-1.5 py-0"
                >
                  {tab.count}
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {/* Reviews List */}
      {activeReviews.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-neutral-300" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            لا توجد تقييمات بعد
          </h3>
          <p className="text-neutral-500 text-sm">
            {activeTab === "received"
              ? "ستظهر هنا التقييمات التي يرسلها لك العملاء"
              : "ستظهر هنا التقييمات التي أرسلتها بعد إكمال المهام"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeReviews.map((review) => {
            const name =
              activeTab === "received"
                ? (review as any).reviewerName
                : (review as any).providerName;
            const avatar =
              activeTab === "received"
                ? (review as any).reviewerAvatar
                : (review as any).providerAvatar;

            return (
              <Card key={review._id} className="hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar src={avatar} alt={name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {name}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {activeTab === "received" ? "عميل" : "حرفي"}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400 shrink-0">
                          {new Date(review._creationTime).toLocaleDateString(
                            "ar-JO",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>

                      <StarRating
                        rating={review.rating}
                        size="sm"
                        showValue={false}
                      />

                      <p className="text-sm text-neutral-600 leading-relaxed mt-2">
                        {review.comment}
                      </p>

                      {review.jobTitle && (
                        <Link
                          href={`/dashboard/jobs/${review.jobId}`}
                          className="inline-flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 mt-2 transition-colors"
                        >
                          <MessageSquareText className="h-3 w-3" />
                          {review.jobTitle}
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
