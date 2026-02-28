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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">المهام</h1>
        <p className="text-neutral-500 mt-1">
          تابع جميع المهام الجارية والسابقة
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
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

      {/* Jobs list */}
      {jobs === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
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
        <div className="space-y-3">
          {jobs.map((job) => {
            const config = statusConfig[job.status] ?? statusConfig.requested;
            const StatusIcon = config.icon;

            return (
              <Link key={job._id} href={`/dashboard/jobs/${job._id}`}>
                <Card hover className="mb-3">
                  <CardContent>
                    <div className="flex items-start gap-4">
                      {/* Counterparty avatar */}
                      <Avatar
                        src={job.counterpartyAvatarUrl}
                        alt={job.counterpartyName}
                        size="md"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {job.title}
                          </h3>
                          <Badge variant={config.variant}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>

                        <p className="text-sm text-neutral-500 mb-2">
                          {job.userRole === "customer"
                            ? `الحرفي: ${job.counterpartyName}`
                            : `العميل: ${job.counterpartyName}`}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Banknote className="h-3.5 w-3.5" />
                            {job.price} د.أ
                          </span>
                          {job.isDirectHire && (
                            <Badge variant="default">توظيف مباشر</Badge>
                          )}
                          <span className="flex items-center gap-1 text-neutral-400">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(job._creationTime).toLocaleDateString(
                              "ar-JO"
                            )}
                          </span>
                        </div>
                      </div>

                      <ArrowLeft className="h-5 w-5 text-neutral-400 shrink-0 mt-2" />
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
