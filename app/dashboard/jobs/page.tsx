"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobCardSkeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { cityLabels } from "@/lib/constants";
import {
  Briefcase,
  Clock,
  MapPin,
  Banknote,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Play,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "primary" | "success" | "warning" | "error" | "info" | "accent"; icon: typeof Clock }
> = {
  requested: { label: "بانتظار الرد", variant: "info", icon: Clock },
  quoted: { label: "تم التسعير", variant: "info", icon: Banknote },
  accepted: { label: "مقبولة", variant: "primary", icon: CheckCircle2 },
  in_progress: { label: "قيد التنفيذ", variant: "accent", icon: Play },
  completed: { label: "مكتملة", variant: "success", icon: CheckCircle2 },
  confirmed: { label: "مؤكدة", variant: "success", icon: UserCheck },
  reviewed: { label: "تم التقييم", variant: "success", icon: Star },
  cancelled: { label: "ملغاة", variant: "error", icon: XCircle },
  disputed: { label: "نزاع", variant: "warning", icon: AlertTriangle },
};

type TabKey = "active" | "past";

export default function JobsListingPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const jobs = useQuery(api.jobs.listByUser, { filter: activeTab });

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "active", label: "المهام النشطة" },
    { key: "past", label: "المهام السابقة" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">مهامي</h1>
        <p className="text-neutral-500 mt-1">تابع جميع مهامك النشطة والسابقة</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === tab.key
                ? "bg-white text-foreground shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {jobs === undefined ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {activeTab === "active"
                  ? "لا توجد مهام نشطة"
                  : "لا توجد مهام سابقة"}
              </h3>
              <p className="text-neutral-500 mb-6">
                {activeTab === "active"
                  ? "ابدأ بتصفح الطلبات أو انشر طلباً جديداً"
                  : "ستظهر هنا المهام المكتملة والملغاة"}
              </p>
              {activeTab === "active" && (
                <div className="flex gap-3 justify-center">
                  <Link href="/dashboard/requests/new">
                    <Button variant="primary">نشر طلب جديد</Button>
                  </Link>
                  <Link href="/dashboard/browse-requests">
                    <Button variant="secondary">تصفح الطلبات</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const config = statusConfig[job.status] ?? statusConfig.requested;
            const StatusIcon = config.icon;

            return (
              <Link key={job._id} href={`/dashboard/jobs/${job._id}`}>
                <Card className="hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer group">
                  <CardContent>
                    <div className="flex items-start gap-4">
                      {/* Other party avatar */}
                      <Avatar
                        src={job.otherPartyAvatar}
                        alt={job.otherPartyName}
                        size="md"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary-600 transition-colors truncate">
                              {job.title}
                            </h3>
                            <p className="text-sm text-neutral-500 mt-0.5">
                              {job.role === "customer" ? "الحرفي:" : "العميل:"}{" "}
                              <span className="text-neutral-700">
                                {job.otherPartyName}
                              </span>
                            </p>
                          </div>

                          <Badge variant={config.variant} className="shrink-0">
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                          {job.categoryNameAr && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5" />
                              {job.categoryNameAr}
                            </span>
                          )}
                          {job.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {cityLabels[job.city] ?? job.city}
                            </span>
                          )}
                          {job.price > 0 && (
                            <span className="flex items-center gap-1">
                              <Banknote className="h-3.5 w-3.5" />
                              {job.price} د.أ
                            </span>
                          )}
                          {job.isDirectHire && (
                            <Badge variant="accent" className="text-[10px]">
                              توظيف مباشر
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-neutral-400">
                            {new Date(job._creationTime).toLocaleDateString(
                              "ar-JO",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <ArrowLeft className="h-4 w-4 text-neutral-300 group-hover:text-primary-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
