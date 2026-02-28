"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { cityLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Banknote,
  MapPin,
  Play,
  Flag,
  MessageSquare,
  ArrowDown,
  User,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

// ──────────────────────────────────────────────
// Status configuration
// ──────────────────────────────────────────────

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ElementType;
  }
> = {
  requested: {
    label: "بانتظار القبول",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    icon: Clock,
  },
  quoted: {
    label: "تم تقديم عرض",
    color: "text-primary-700",
    bgColor: "bg-primary-50 border-primary-200",
    icon: Clock,
  },
  accepted: {
    label: "تم القبول",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
  },
  in_progress: {
    label: "قيد التنفيذ",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    icon: Play,
  },
  completed: {
    label: "مكتمل",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
  },
  confirmed: {
    label: "تم التأكيد",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
  },
  reviewed: {
    label: "تم التقييم",
    color: "text-neutral-700",
    bgColor: "bg-neutral-50 border-neutral-200",
    icon: Star,
  },
  cancelled: {
    label: "ملغي",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    icon: XCircle,
  },
  disputed: {
    label: "متنازع عليه",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    icon: AlertTriangle,
  },
};

const statusHistoryLabels: Record<string, string> = {
  requested: "تم إنشاء الطلب",
  quoted: "تم تقديم عرض سعر",
  accepted: "تم قبول المهمة",
  in_progress: "بدأ التنفيذ",
  completed: "أعلن الحرفي اكتمال العمل",
  confirmed: "أكّد العميل اكتمال العمل",
  reviewed: "تم التقييم",
  cancelled: "تم الإلغاء",
  disputed: "تم رفع نزاع",
};

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const job = useQuery(api.jobs.getDetail, {
    jobId: id as Id<"jobs">,
  });
  const updateStatus = useMutation(api.jobs.updateStatus);

  const [confirmAction, setConfirmAction] = useState<{
    status: string;
    title: string;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  if (job === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                المهمة غير موجودة
              </h2>
              <p className="text-neutral-500 mb-4">
                عذراً، لم نتمكن من العثور على هذه المهمة أو ليس لديك صلاحية
                الوصول إليها.
              </p>
              <Link href="/dashboard/jobs">
                <Button variant="secondary">العودة للمهام</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = statusConfig[job.status] ?? statusConfig.requested;
  const StatusIcon = config.icon;
  const isCustomer = job.userRole === "customer";

  // Determine available actions based on current status and user role
  const actions = getAvailableActions(job.status, job.userRole);

  async function handleAction(newStatus: string) {
    setLoading(true);
    try {
      await updateStatus({
        jobId: id as Id<"jobs">,
        newStatus: newStatus as any,
      });
      setConfirmAction(null);
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link
          href="/dashboard/jobs"
          className="hover:text-foreground transition-colors"
        >
          المهام
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate">{job.title}</span>
      </div>

      {/* Status Banner */}
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-4 rounded-xl border",
          config.bgColor
        )}
      >
        <StatusIcon className={cn("h-6 w-6", config.color)} />
        <div>
          <p className={cn("font-semibold text-lg", config.color)}>
            {config.label}
          </p>
          <p className="text-sm text-neutral-500">
            {getStatusDescription(job.status, job.userRole)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Info */}
          <Card>
            <CardContent>
              <h2 className="text-xl font-bold text-foreground mb-3">
                {job.title}
              </h2>
              <p className="text-neutral-600 leading-relaxed mb-4">
                {job.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-neutral-600">
                  <Banknote className="h-4 w-4 text-primary-500" />
                  <span className="font-semibold">{job.price} د.أ</span>
                </span>
                {job.request?.city && (
                  <span className="flex items-center gap-1.5 text-neutral-600">
                    <MapPin className="h-4 w-4 text-primary-500" />
                    {cityLabels[job.request.city] ?? job.request.city}
                  </span>
                )}
                {job.isDirectHire && (
                  <Badge variant="default">توظيف مباشر</Badge>
                )}
                {job.quote && (
                  <span className="flex items-center gap-1.5 text-neutral-600">
                    <Clock className="h-4 w-4 text-primary-500" />
                    {job.quote.estimatedDuration}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quote details (if from a request) */}
          {job.quote && (
            <Card>
              <CardContent>
                <h3 className="font-semibold text-foreground mb-3">
                  تفاصيل العرض
                </h3>
                <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">السعر</span>
                    <span className="font-semibold text-foreground">
                      {job.quote.price} د.أ
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">المدة المتوقعة</span>
                    <span className="font-semibold text-foreground">
                      {job.quote.estimatedDuration}
                    </span>
                  </div>
                  {job.quote.message && (
                    <div className="pt-2 border-t border-neutral-200">
                      <p className="text-sm text-neutral-600">
                        {job.quote.message}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {actions.length > 0 && (
            <Card>
              <CardContent>
                <h3 className="font-semibold text-foreground mb-4">
                  الإجراءات المتاحة
                </h3>
                <div className="flex flex-wrap gap-3">
                  {actions.map((action) => (
                    <Button
                      key={action.status}
                      variant={action.variant}
                      onClick={() =>
                        setConfirmAction({
                          status: action.status,
                          title: action.confirmTitle,
                          message: action.confirmMessage,
                        })
                      }
                    >
                      <action.icon className="h-4 w-4" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review (if exists) */}
          {job.review && (
            <Card>
              <CardContent>
                <h3 className="font-semibold text-foreground mb-3">التقييم</h3>
                <div className="flex items-center gap-2 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-5 w-5",
                        i < job.review!.rating
                          ? "text-accent-500 fill-accent-500"
                          : "text-neutral-300"
                      )}
                    />
                  ))}
                </div>
                <p className="text-neutral-600">{job.review.comment}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardContent>
              <h3 className="font-semibold text-foreground mb-4">
                سجل الحالات
              </h3>
              <div className="relative">
                {job.statusHistory.map((entry, index) => {
                  const isLast = index === job.statusHistory.length - 1;
                  const entryConfig =
                    statusConfig[entry.status] ?? statusConfig.requested;
                  const EntryIcon = entryConfig.icon;

                  return (
                    <div key={index} className="flex gap-4 pb-6 last:pb-0">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0",
                            isLast
                              ? "border-primary-500 bg-primary-50"
                              : "border-neutral-300 bg-neutral-50"
                          )}
                        >
                          <EntryIcon
                            className={cn(
                              "h-4 w-4",
                              isLast
                                ? "text-primary-600"
                                : "text-neutral-400"
                            )}
                          />
                        </div>
                        {!isLast && (
                          <div className="w-0.5 flex-1 bg-neutral-200 mt-1" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="pt-1 pb-2">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isLast ? "text-foreground" : "text-neutral-600"
                          )}
                        >
                          {statusHistoryLabels[entry.status] ?? entry.status}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {new Date(entry.timestamp).toLocaleDateString(
                            "ar-JO",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardContent>
              <h3 className="text-sm font-medium text-neutral-500 mb-3">
                العميل
              </h3>
              <div className="flex items-center gap-3">
                <Avatar
                  src={job.customer.avatarUrl}
                  alt={job.customer.name}
                  size="md"
                />
                <div>
                  <p className="font-semibold text-foreground">
                    {job.customer.name}
                  </p>
                  {isCustomer && (
                    <Badge variant="primary" className="mt-0.5">
                      أنت
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Provider Info */}
          <Card>
            <CardContent>
              <h3 className="text-sm font-medium text-neutral-500 mb-3">
                الحرفي
              </h3>
              <div className="flex items-center gap-3">
                <Avatar
                  src={job.provider.avatarUrl}
                  alt={job.provider.name}
                  size="md"
                />
                <div>
                  <p className="font-semibold text-foreground">
                    {job.provider.name}
                  </p>
                  {!isCustomer && (
                    <Badge variant="primary" className="mt-0.5">
                      أنت
                    </Badge>
                  )}
                </div>
              </div>
              {job.provider.bio && (
                <p className="text-sm text-neutral-500 mt-3 line-clamp-3">
                  {job.provider.bio}
                </p>
              )}
              <Link href={`/providers/${job.provider._id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full"
                >
                  <User className="h-4 w-4" />
                  عرض الملف الشخصي
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Job Summary */}
          <Card>
            <CardContent>
              <h3 className="text-sm font-medium text-neutral-500 mb-3">
                ملخص المهمة
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">السعر</dt>
                  <dd className="font-semibold text-foreground">
                    {job.price} د.أ
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">نوع المهمة</dt>
                  <dd className="font-medium text-foreground">
                    {job.isDirectHire ? "توظيف مباشر" : "عبر طلب"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">تاريخ الإنشاء</dt>
                  <dd className="font-medium text-foreground">
                    {new Date(job._creationTime).toLocaleDateString("ar-JO")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">الرسائل</dt>
                  <dd className="font-medium text-foreground">
                    {job.messageCount}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Original Request Link */}
          {job.request && (
            <Link href={`/dashboard/requests/${job.request._id}`}>
              <Button variant="ghost" className="w-full">
                <ArrowDown className="h-4 w-4 rotate-90" />
                عرض الطلب الأصلي
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.title ?? ""}
      >
        <p className="text-neutral-600 mb-6">{confirmAction?.message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setConfirmAction(null)}>
            إلغاء
          </Button>
          <Button
            variant={
              confirmAction?.status === "cancelled" ||
              confirmAction?.status === "disputed"
                ? "danger"
                : "primary"
            }
            disabled={loading}
            onClick={() =>
              confirmAction && handleAction(confirmAction.status)
            }
          >
            {loading ? <Spinner size="sm" /> : "تأكيد"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ──────────────────────────────────────────────
// Helper: determine available actions
// ──────────────────────────────────────────────

function getAvailableActions(
  status: string,
  userRole: "customer" | "provider"
) {
  const actions: Array<{
    status: string;
    label: string;
    variant: "primary" | "secondary" | "danger";
    icon: React.ElementType;
    confirmTitle: string;
    confirmMessage: string;
  }> = [];

  if (status === "requested" && userRole === "customer") {
    actions.push({
      status: "accepted",
      label: "قبول الطلب",
      variant: "primary",
      icon: CheckCircle2,
      confirmTitle: "قبول طلب التوظيف المباشر",
      confirmMessage: "هل أنت متأكد من قبول هذا الطلب؟ سيتم بدء المهمة مع الحرفي.",
    });
  }

  if (status === "accepted") {
    actions.push({
      status: "in_progress",
      label: "بدء التنفيذ",
      variant: "primary",
      icon: Play,
      confirmTitle: "بدء تنفيذ المهمة",
      confirmMessage: "هل أنت متأكد من بدء تنفيذ المهمة؟",
    });
  }

  if (status === "in_progress" && userRole === "provider") {
    actions.push({
      status: "completed",
      label: "إعلان الاكتمال",
      variant: "primary",
      icon: CheckCircle2,
      confirmTitle: "إعلان اكتمال المهمة",
      confirmMessage:
        "هل أنت متأكد أن العمل مكتمل؟ سيتم إخطار العميل للتأكيد.",
    });
  }

  if (status === "completed" && userRole === "customer") {
    actions.push({
      status: "confirmed",
      label: "تأكيد الاكتمال",
      variant: "primary",
      icon: CheckCircle2,
      confirmTitle: "تأكيد اكتمال المهمة",
      confirmMessage:
        "هل أنت متأكد من اكتمال العمل بشكل مرضٍ؟ بعد التأكيد يمكنك تقييم الحرفي.",
    });
  }

  // Cancel — only before in_progress
  if (
    ["requested", "quoted", "accepted"].includes(status)
  ) {
    actions.push({
      status: "cancelled",
      label: "إلغاء المهمة",
      variant: "danger",
      icon: XCircle,
      confirmTitle: "إلغاء المهمة",
      confirmMessage:
        "هل أنت متأكد من إلغاء المهمة؟ لا يمكن التراجع عن هذا الإجراء.",
    });
  }

  // Dispute — from in_progress or completed
  if (["in_progress", "completed"].includes(status)) {
    actions.push({
      status: "disputed",
      label: "رفع نزاع",
      variant: "danger",
      icon: AlertTriangle,
      confirmTitle: "رفع نزاع",
      confirmMessage:
        "هل تريد رفع نزاع على هذه المهمة؟ سيتم مراجعة الحالة من قبل الإدارة.",
    });
  }

  return actions;
}

// ──────────────────────────────────────────────
// Helper: status description for the user
// ──────────────────────────────────────────────

function getStatusDescription(
  status: string,
  userRole: "customer" | "provider"
): string {
  const descriptions: Record<string, Record<string, string>> = {
    requested: {
      customer: "في انتظار قبول الحرفي لطلبك.",
      provider: "لديك طلب توظيف مباشر جديد. يمكنك قبوله أو رفضه.",
    },
    accepted: {
      customer: "تم قبول المهمة. يمكنك أنت أو الحرفي بدء التنفيذ.",
      provider: "تم قبول المهمة. يمكنك بدء التنفيذ عندما تكون جاهزاً.",
    },
    in_progress: {
      customer: "المهمة قيد التنفيذ. سيُعلمك الحرفي عند الانتهاء.",
      provider: "أنت تعمل على المهمة حالياً. أعلن الاكتمال عند الانتهاء.",
    },
    completed: {
      customer: "أعلن الحرفي اكتمال العمل. تحقق وأكّد الاكتمال.",
      provider: "في انتظار تأكيد العميل لاكتمال العمل.",
    },
    confirmed: {
      customer: "تم تأكيد اكتمال المهمة. يمكنك تقييم الحرفي الآن.",
      provider: "أكّد العميل اكتمال المهمة بنجاح.",
    },
    reviewed: {
      customer: "تم تقييم المهمة بنجاح.",
      provider: "تم تقييم المهمة من قبل العميل.",
    },
    cancelled: {
      customer: "تم إلغاء المهمة.",
      provider: "تم إلغاء المهمة.",
    },
    disputed: {
      customer: "هناك نزاع مفتوح على هذه المهمة.",
      provider: "هناك نزاع مفتوح على هذه المهمة.",
    },
  };

  return descriptions[status]?.[userRole] ?? "";
}
