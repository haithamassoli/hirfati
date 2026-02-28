"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  ArrowLeft,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TabFilter = "active" | "past";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "success" | "primary" | "default" | "warning" | "error";
    icon: React.ElementType;
  }
> = {
  requested: { label: "بانتظار القبول", variant: "warning", icon: Clock },
  quoted: { label: "تم تقديم عرض", variant: "primary", icon: Clock },
  accepted: { label: "تم القبول", variant: "success", icon: CheckCircle2 },
  in_progress: { label: "قيد التنفيذ", variant: "primary", icon: Clock },
  completed: { label: "مكتمل", variant: "success", icon: CheckCircle2 },
  confirmed: { label: "تم التأكيد", variant: "success", icon: CheckCircle2 },
  reviewed: { label: "تم التقييم", variant: "default", icon: Star },
  cancelled: { label: "ملغي", variant: "error", icon: XCircle },
  disputed: { label: "متنازع عليه", variant: "warning", icon: AlertTriangle },
};

export default function JobsListingPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("active");

  const jobs = useQuery(api.jobs.listByUser, { filter: activeTab });
  const jobsList = jobs ?? [];
  const isLoading = jobs === undefined;

  const statusCounts = jobsList.reduce<Record<string, number>>((acc, job) => {
    acc[job.status] = (acc[job.status] ?? 0) + 1;
    return acc;
  }, {});

  const attentionCount =
    (statusCounts.requested ?? 0) + (statusCounts.quoted ?? 0);
  const progressCount =
    (statusCounts.accepted ?? 0) +
    (statusCounts.in_progress ?? 0) +
    (statusCounts.completed ?? 0);
  const successCount =
    (statusCounts.confirmed ?? 0) + (statusCounts.reviewed ?? 0);
  const riskCount =
    (statusCounts.cancelled ?? 0) + (statusCounts.disputed ?? 0);

  const summaryCards =
    activeTab === "active"
      ? [
          {
            label: "إجمالي المهام النشطة",
            value: jobsList.length,
            icon: Briefcase,
            tone: "primary",
          },
          {
            label: "تحتاج متابعة",
            value: attentionCount,
            icon: Clock,
            tone: "warning",
          },
          {
            label: "قيد التنفيذ",
            value: progressCount,
            icon: CheckCircle2,
            tone: "success",
          },
        ]
      : [
          {
            label: "إجمالي المهام السابقة",
            value: jobsList.length,
            icon: Briefcase,
            tone: "neutral",
          },
          {
            label: "مكتملة ومؤكدة",
            value: successCount,
            icon: Star,
            tone: "success",
          },
          {
            label: "ملغية أو متنازع عليها",
            value: riskCount,
            icon: AlertTriangle,
            tone: "error",
          },
        ];

  const toneStyles: Record<string, { icon: string; ring: string }> = {
    primary: {
      icon: "bg-primary-100 text-primary-700",
      ring: "border-primary-100",
    },
    warning: {
      icon: "bg-warning-light text-warning",
      ring: "border-warning-light",
    },
    success: {
      icon: "bg-success-light text-success",
      ring: "border-success-light",
    },
    neutral: {
      icon: "bg-neutral-100 text-neutral-600",
      ring: "border-neutral-200",
    },
    error: {
      icon: "bg-error-light text-error",
      ring: "border-error-light",
    },
  };

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("ar-JO").format(value);
  const formatDate = (value: number) =>
    new Intl.DateTimeFormat("ar-JO", { dateStyle: "medium" }).format(
      new Date(value)
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6">
        <div className="pointer-events-none absolute -top-10 right-0 h-32 w-32 translate-x-10 rounded-full bg-primary-100/70 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 -translate-x-10 translate-y-8 rounded-full bg-accent-100/70 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-700">
              لوحة متابعة المهام
            </p>
            <h1 className="text-2xl font-bold text-foreground mt-1">
              المهام
            </h1>
            <p className="text-neutral-600 mt-2">
              تابع جميع المهام الجارية والسابقة وتفاصيل كل مهمة.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 sm:grid-cols-3 gap-3 lg:w-auto">
            {summaryCards.map((card) => {
              const tone = toneStyles[card.tone];
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className={cn(
                    "rounded-xl border bg-white/80 p-3 shadow-sm backdrop-blur",
                    tone.ring
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        tone.icon
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">{card.label}</p>
                      <p className="text-lg font-bold text-foreground">
                        {isLoading ? "--" : formatNumber(card.value)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="rounded-2xl border border-border bg-surface p-2 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-neutral-100 p-1">
            <button
              onClick={() => setActiveTab("active")}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer",
                activeTab === "active"
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              المهام النشطة
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer",
                activeTab === "past"
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              المهام السابقة
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Badge variant="accent">تلميح</Badge>
            <span>اضغط على المهمة لعرض التفاصيل وتحديث الحالة.</span>
          </div>
        </div>
      </div>

      {/* Jobs list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : jobsList.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {activeTab === "active"
                  ? "لا توجد مهام نشطة"
                  : "لا توجد مهام سابقة"}
              </h2>
              <p className="text-neutral-500">
                {activeTab === "active"
                  ? "عندما تقبل عرض سعر أو تطلب خدمة مباشرة، ستظهر المهمة هنا."
                  : "المهام المكتملة والملغية ستظهر هنا."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobsList.map((job) => {
            const config = statusConfig[job.status] ?? statusConfig.requested;
            const StatusIcon = config.icon;
            const statusTimestamp =
              job.statusHistory && job.statusHistory.length > 0
                ? job.statusHistory[job.statusHistory.length - 1].timestamp
                : job._creationTime;

            return (
              <Link
                key={job._id}
                href={`/dashboard/jobs/${job._id}`}
                className="block"
              >
                <Card hover className="group">
                  <CardContent>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={job.counterpartyAvatarUrl}
                          alt={job.counterpartyName}
                          size="lg"
                        />
                        <div>
                          <p className="text-xs text-neutral-500">
                            {job.userRole === "customer"
                              ? "الحرفي"
                              : "العميل"}
                          </p>
                          <p className="font-semibold text-foreground">
                            {job.counterpartyName}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {job.title}
                          </h3>
                          <Badge variant={config.variant} className="gap-1.5">
                            <StatusIcon className="h-3.5 w-3.5" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                          {job.userRole === "customer"
                            ? `متابعة مع ${job.counterpartyName}`
                            : `طلب مقدم من ${job.counterpartyName}`}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Banknote className="h-3.5 w-3.5" />
                            {formatNumber(job.price)} د.أ
                          </span>
                          {job.isDirectHire && (
                            <Badge variant="accent">توظيف مباشر</Badge>
                          )}
                          <span className="flex items-center gap-1 text-neutral-400">
                            <Clock className="h-3.5 w-3.5" />
                            آخر تحديث {formatDate(statusTimestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-neutral-400">
                        <ArrowLeft className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:-translate-x-1" />
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
