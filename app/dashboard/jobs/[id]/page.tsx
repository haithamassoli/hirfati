"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { JobChat } from "@/components/chat/job-chat";
import { cityLabels } from "@/lib/constants";
import {
  ArrowRight,
  Clock,
  MapPin,
  Banknote,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Play,
  UserCheck,
  MessageSquare,
  Calendar,
  User,
  Briefcase,
  FileText,
  Ban,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { use, useState, useCallback } from "react";
import type { Id } from "@/convex/_generated/dataModel";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "primary" | "success" | "warning" | "error" | "info" | "accent"; icon: typeof Clock; color: string }
> = {
  requested: { label: "بانتظار الرد", variant: "info", icon: Clock, color: "text-blue-500" },
  quoted: { label: "تم التسعير", variant: "info", icon: Banknote, color: "text-blue-500" },
  accepted: { label: "مقبولة", variant: "primary", icon: CheckCircle2, color: "text-primary-500" },
  in_progress: { label: "قيد التنفيذ", variant: "accent", icon: Play, color: "text-accent-500" },
  completed: { label: "مكتملة", variant: "success", icon: CheckCircle2, color: "text-green-500" },
  confirmed: { label: "مؤكدة", variant: "success", icon: UserCheck, color: "text-green-600" },
  reviewed: { label: "تم التقييم", variant: "success", icon: Star, color: "text-green-600" },
  cancelled: { label: "ملغاة", variant: "error", icon: XCircle, color: "text-red-500" },
  disputed: { label: "نزاع", variant: "warning", icon: AlertTriangle, color: "text-orange-500" },
};

const statusTimelineLabels: Record<string, string> = {
  requested: "تم إرسال الطلب",
  quoted: "تم التسعير",
  accepted: "تم قبول المهمة",
  in_progress: "بدء التنفيذ",
  completed: "تم الإكمال",
  confirmed: "تأكيد الاكتمال",
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
  const isValidId = /^[a-z0-9]{32}$/.test(id) || id.startsWith("k");
  const job = useQuery(api.jobs.getDetail, isValidId ? { id: id as Id<"jobs"> } : "skip");
  const transitionStatus = useMutation(api.jobs.transitionStatus);
  const respondToDirectHire = useMutation(api.jobs.respondToDirectHire);

  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTransition = useCallback(
    async (newStatus: string) => {
      setIsSubmitting(true);
      try {
        await transitionStatus({
          jobId: id as Id<"jobs">,
          newStatus: newStatus as any,
        });
        setConfirmAction(null);
      } catch (err: any) {
        alert(err.message || "حدث خطأ");
      } finally {
        setIsSubmitting(false);
      }
    },
    [transitionStatus, id]
  );

  const handleDirectHireResponse = useCallback(
    async (accept: boolean) => {
      setIsSubmitting(true);
      try {
        await respondToDirectHire({
          jobId: id as Id<"jobs">,
          accept,
        });
        setConfirmAction(null);
      } catch (err: any) {
        alert(err.message || "حدث خطأ");
      } finally {
        setIsSubmitting(false);
      }
    },
    [respondToDirectHire, id]
  );

  if (job === undefined && isValidId) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-foreground mb-2">
          المهمة غير موجودة
        </h2>
        <p className="text-neutral-500 mb-6">
          عذراً، لم نتمكن من العثور على هذه المهمة.
        </p>
        <Link href="/dashboard/jobs">
          <Button variant="primary">العودة للمهام</Button>
        </Link>
      </div>
    );
  }

  const config = statusConfig[job.status] ?? statusConfig.requested;
  const StatusIcon = config.icon;

  // Determine available actions
  const actions: Array<{
    key: string;
    label: string;
    icon: typeof Play;
    variant: "primary" | "secondary" | "accent" | "danger";
    confirmTitle: string;
    confirmMessage: string;
  }> = [];

  // Direct hire: provider accepts/rejects
  if (job.isDirectHire && job.status === "requested" && job.isProvider) {
    actions.push({
      key: "accept_direct",
      label: "قبول الطلب",
      icon: CheckCircle2,
      variant: "primary",
      confirmTitle: "قبول طلب التوظيف المباشر",
      confirmMessage: "هل أنت متأكد من قبول هذا الطلب؟ سيتم إنشاء مهمة جديدة معك.",
    });
    actions.push({
      key: "reject_direct",
      label: "رفض الطلب",
      icon: XCircle,
      variant: "danger",
      confirmTitle: "رفض طلب التوظيف المباشر",
      confirmMessage: "هل أنت متأكد من رفض هذا الطلب؟",
    });
  }

  // Standard transitions
  if (job.status === "accepted") {
    actions.push({
      key: "in_progress",
      label: "بدء التنفيذ",
      icon: Play,
      variant: "primary",
      confirmTitle: "بدء التنفيذ",
      confirmMessage: "هل أنت متأكد من بدء تنفيذ هذه المهمة؟",
    });
  }

  if (job.status === "in_progress" && job.isProvider) {
    actions.push({
      key: "completed",
      label: "تحديد كمكتملة",
      icon: CheckCircle2,
      variant: "primary",
      confirmTitle: "تحديد المهمة كمكتملة",
      confirmMessage: "هل أنت متأكد أن المهمة مكتملة؟ سيُطلب من العميل التأكيد.",
    });
  }

  if (job.status === "completed" && job.isCustomer) {
    actions.push({
      key: "confirmed",
      label: "تأكيد الاكتمال",
      icon: UserCheck,
      variant: "primary",
      confirmTitle: "تأكيد اكتمال المهمة",
      confirmMessage: "هل أنت متأكد أن المهمة تمت بنجاح؟",
    });
  }

  // Cancel (before in_progress)
  if (["requested", "quoted", "accepted"].includes(job.status)) {
    actions.push({
      key: "cancelled",
      label: "إلغاء المهمة",
      icon: Ban,
      variant: "danger",
      confirmTitle: "إلغاء المهمة",
      confirmMessage: "هل أنت متأكد من إلغاء هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.",
    });
  }

  // Dispute (from in_progress or completed)
  if (["in_progress", "completed"].includes(job.status)) {
    actions.push({
      key: "disputed",
      label: "رفع نزاع",
      icon: Flag,
      variant: "danger",
      confirmTitle: "رفع نزاع",
      confirmMessage: "هل أنت متأكد من رفع نزاع على هذه المهمة؟ سيتم مراجعة القضية من قبل فريق الدعم.",
    });
  }

  const currentConfirmAction = actions.find((a) => a.key === confirmAction);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-foreground transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للمهام
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
            <Badge variant={config.variant} className="text-sm">
              <StatusIcon className="h-3.5 w-3.5" />
              {config.label}
            </Badge>
          </div>
          <p className="text-neutral-500">{job.description}</p>
        </div>

        {job.isDirectHire && (
          <Badge variant="accent">توظيف مباشر</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parties */}
          <Card>
            <CardContent>
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary-500" />
                الأطراف
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                  <Avatar
                    src={job.customerAvatar}
                    alt={job.customerName}
                    size="md"
                  />
                  <div>
                    <p className="text-xs text-neutral-500 mb-0.5">العميل</p>
                    <p className="font-medium text-foreground">
                      {job.customerName}
                    </p>
                  </div>
                  {job.isCustomer && (
                    <Badge variant="primary" className="mr-auto text-[10px]">
                      أنت
                    </Badge>
                  )}
                </div>

                {/* Provider */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
                  <Avatar
                    src={job.providerAvatar}
                    alt={job.providerName}
                    size="md"
                  />
                  <div>
                    <p className="text-xs text-neutral-500 mb-0.5">الحرفي</p>
                    <p className="font-medium text-foreground">
                      {job.providerName}
                    </p>
                  </div>
                  {job.isProvider && (
                    <Badge variant="primary" className="mr-auto text-[10px]">
                      أنت
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent>
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-500" />
                سجل الحالة
              </h2>
              <div className="relative">
                {job.statusHistory.map((entry, i) => {
                  const entryConfig = statusConfig[entry.status] ?? statusConfig.requested;
                  const EntryIcon = entryConfig.icon;
                  const isLast = i === job.statusHistory.length - 1;

                  return (
                    <div key={i} className="flex gap-4 relative">
                      {/* Line */}
                      {!isLast && (
                        <div className="absolute right-[17px] top-10 bottom-0 w-px bg-neutral-200" />
                      )}

                      {/* Dot */}
                      <div
                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                          isLast
                            ? "bg-primary-50 ring-2 ring-primary-200"
                            : "bg-neutral-100"
                        }`}
                      >
                        <EntryIcon
                          className={`h-4 w-4 ${
                            isLast ? entryConfig.color : "text-neutral-400"
                          }`}
                        />
                      </div>

                      {/* Content */}
                      <div className={`pb-6 ${isLast ? "" : ""}`}>
                        <p
                          className={`font-medium text-sm ${
                            isLast ? "text-foreground" : "text-neutral-600"
                          }`}
                        >
                          {statusTimelineLabels[entry.status] ?? entry.status}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {new Date(entry.timestamp).toLocaleDateString("ar-JO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {actions.length > 0 && (
            <Card>
              <CardContent>
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary-500" />
                  الإجراءات المتاحة
                </h2>
                <div className="flex flex-wrap gap-3">
                  {actions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <Button
                        key={action.key}
                        variant={action.variant}
                        onClick={() => setConfirmAction(action.key)}
                      >
                        <ActionIcon className="h-4 w-4" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat */}
          <Card>
            <CardContent className="!p-0">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary-500" />
                  المحادثة
                </h2>
              </div>
              <JobChat
                jobId={id as Id<"jobs">}
                isChatEligible={
                  !["cancelled"].includes(job.status)
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Info */}
          <Card>
            <CardContent>
              <h3 className="font-semibold text-foreground mb-4">تفاصيل المهمة</h3>
              <dl className="space-y-3 text-sm">
                {job.price > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="text-neutral-500 flex items-center gap-1.5">
                      <Banknote className="h-4 w-4" />
                      السعر
                    </dt>
                    <dd className="font-semibold text-primary-600">
                      {job.price} د.أ
                    </dd>
                  </div>
                )}

                {job.categoryNameAr && (
                  <div className="flex items-center justify-between">
                    <dt className="text-neutral-500 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" />
                      التصنيف
                    </dt>
                    <dd className="font-medium text-foreground">
                      {job.categoryNameAr}
                    </dd>
                  </div>
                )}

                {job.requestCity && (
                  <div className="flex items-center justify-between">
                    <dt className="text-neutral-500 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      المدينة
                    </dt>
                    <dd className="font-medium text-foreground">
                      {cityLabels[job.requestCity] ?? job.requestCity}
                    </dd>
                  </div>
                )}

                {job.quotedDuration && (
                  <div className="flex items-center justify-between">
                    <dt className="text-neutral-500 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      المدة المقدرة
                    </dt>
                    <dd className="font-medium text-foreground">
                      {job.quotedDuration}
                    </dd>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    تاريخ الإنشاء
                  </dt>
                  <dd className="font-medium text-foreground">
                    {new Date(job._creationTime).toLocaleDateString("ar-JO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </dd>
                </div>

                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    الرسائل
                  </dt>
                  <dd className="font-medium text-foreground">
                    {job.messageCount}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Quote Details */}
          {job.quoteMessage && (
            <Card>
              <CardContent>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary-500" />
                  رسالة العرض
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {job.quoteMessage}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Related Request */}
          {job.requestId && (
            <Link href={`/dashboard/requests/${job.requestId}`}>
              <Button variant="secondary" className="w-full">
                <FileText className="h-4 w-4" />
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
        title={currentConfirmAction?.confirmTitle ?? "تأكيد"}
      >
        <p className="text-neutral-600 mb-6">
          {currentConfirmAction?.confirmMessage}
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => setConfirmAction(null)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button
            variant={currentConfirmAction?.variant ?? "primary"}
            isLoading={isSubmitting}
            onClick={() => {
              if (confirmAction === "accept_direct") {
                handleDirectHireResponse(true);
              } else if (confirmAction === "reject_direct") {
                handleDirectHireResponse(false);
              } else if (confirmAction) {
                handleTransition(confirmAction);
              }
            }}
          >
            تأكيد
          </Button>
        </div>
      </Modal>
    </div>
  );
}
