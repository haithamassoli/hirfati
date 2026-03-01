"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { DashboardStatsSkeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  User,
  AlertCircle,
  ArrowLeft,
  ClipboardList,
  Star,
  FileText,
  MessageCircle,
  Search,
  TrendingUp,
  Clock,
  CheckCircle2,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  requested: "طلب جديد",
  quoted: "تم التسعير",
  accepted: "مقبول",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  confirmed: "مؤكد",
  reviewed: "تم التقييم",
  cancelled: "ملغي",
  disputed: "متنازع عليه",
};

const statusColors: Record<string, string> = {
  requested: "bg-blue-100 text-blue-700",
  quoted: "bg-purple-100 text-purple-700",
  accepted: "bg-teal-100 text-teal-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  reviewed: "bg-primary-100 text-primary-700",
  cancelled: "bg-neutral-100 text-neutral-600",
  disputed: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const user = useQuery(api.profile.getCurrentUser);
  const summary = useQuery(api.dashboard.getSummary);

  if (user === undefined || summary === undefined) {
    return (
      <div className="max-w-5xl mx-auto py-6">
        <DashboardStatsSkeleton />
      </div>
    );
  }

  if (!user || !summary) return null;

  const isProvider = user.isProvider;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          مرحبا، {user.name}
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          {isProvider
            ? "إليك ملخص نشاطك كحرفي على المنصة"
            : "إليك ملخص نشاطك على المنصة"}
        </p>
      </div>

      {/* ── Onboarding Prompts ── */}
      {isProvider && !summary.isProfileComplete && (
        <Card className="border-accent-200 bg-gradient-to-l from-accent-50 to-amber-50 overflow-hidden relative">
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6 text-accent-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1 text-base">
                  أكمل ملفك الشخصي للبدء
                </h3>
                <p className="text-sm text-neutral-600 mb-3 leading-relaxed">
                  لتظهر في نتائج البحث وتبدأ في استقبال طلبات العمل، أكمل
                  ملفك الشخصي: أضف نبذة عنك، تخصصاتك، ومناطق خدمتك.
                </p>
                <Link href="/dashboard/profile">
                  <Button variant="accent" size="sm">
                    إكمال الملف الشخصي
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isProvider && summary.totalRequestsCount === 0 && (
        <Card className="border-primary-200 bg-gradient-to-l from-primary-50 to-teal-50">
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1 text-base">
                  ابدأ بنشر أول طلب لك
                </h3>
                <p className="text-sm text-neutral-600 mb-3 leading-relaxed">
                  أنشر طلبك ليتقدم الحرفيون بعروضهم. اختر التصنيف والمدينة
                  والميزانية وسنوصلك بأفضل المتخصصين.
                </p>
                <Link href="/dashboard/requests/new">
                  <Button variant="primary" size="sm">
                    نشر طلب جديد
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isProvider &&
        summary.isProfileComplete &&
        summary.activeServicesCount === 0 && (
          <Card className="border-blue-200 bg-gradient-to-l from-blue-50 to-sky-50">
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1 text-base">
                    أضف خدماتك لجذب العملاء
                  </h3>
                  <p className="text-sm text-neutral-600 mb-3 leading-relaxed">
                    أضف الخدمات التي تقدمها مع الأسعار لتظهر للعملاء عند البحث
                    عن تخصصك.
                  </p>
                  <Link href="/dashboard/services">
                    <Button variant="primary" size="sm">
                      إضافة خدمة
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* ── Summary Stats Grid ── */}
      {isProvider ? (
        <ProviderStats summary={summary} />
      ) : (
        <CustomerStats summary={summary} />
      )}

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-3">
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {isProvider ? (
            <>
              <QuickAction
                href="/dashboard/browse-requests"
                icon={Search}
                label="تصفح الطلبات"
                color="text-primary-600 bg-primary-50"
              />
              <QuickAction
                href="/dashboard/services"
                icon={Briefcase}
                label="إدارة الخدمات"
                color="text-blue-600 bg-blue-50"
              />
              <QuickAction
                href="/dashboard/profile"
                icon={User}
                label="تعديل الملف"
                color="text-neutral-600 bg-neutral-100"
              />
            </>
          ) : (
            <>
              <QuickAction
                href="/dashboard/requests/new"
                icon={PlusCircle}
                label="نشر طلب جديد"
                color="text-primary-600 bg-primary-50"
              />
              <QuickAction
                href="/dashboard/requests"
                icon={FileText}
                label="طلباتي"
                color="text-blue-600 bg-blue-50"
              />
              <QuickAction
                href="/dashboard/profile"
                icon={User}
                label="تعديل الملف"
                color="text-neutral-600 bg-neutral-100"
              />
            </>
          )}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      {summary.recentActivity.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">
              النشاط الأخير
            </h2>
            <Link
              href="/dashboard/jobs"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              عرض الكل
            </Link>
          </div>
          <div className="space-y-2">
            {summary.recentActivity.map((activity) => (
              <Link
                key={activity._id}
                href={`/dashboard/jobs/${activity._id}`}
              >
                <Card hover className="!p-4">
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={activity.otherPartyAvatar}
                        alt={activity.otherPartyName}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-neutral-500">
                            {activity.role === "customer" ? "مع" : "من"}{" "}
                            {activity.otherPartyName}
                          </span>
                          <span className="text-neutral-300">·</span>
                          <span className="text-xs text-neutral-400">
                            {formatRelativeTime(activity.lastUpdate)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColors[activity.status] ?? "bg-neutral-100 text-neutral-600"}`}
                      >
                        {statusLabels[activity.status] ?? activity.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no activity at all */}
      {summary.recentActivity.length === 0 &&
        summary.totalJobsCount === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="h-8 w-8 text-neutral-300" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              لا يوجد نشاط بعد
            </h3>
            <p className="text-neutral-500 text-sm max-w-sm mx-auto">
              {isProvider
                ? "ابدأ بتصفح الطلبات المتاحة أو انتظر حتى يتواصل معك العملاء"
                : "انشر أول طلب لك أو تصفح الحرفيين المتاحين"}
            </p>
          </div>
        )}
    </div>
  );
}

// ── Provider Stats Component ──
function ProviderStats({
  summary,
}: {
  summary: NonNullable<ReturnType<typeof useQuery<typeof api.dashboard.getSummary>>>;
}) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={ClipboardList}
        iconBg="bg-primary-50"
        iconColor="text-primary-600"
        label="مهام نشطة"
        value={summary.activeJobsCount}
      />
      <StatCard
        icon={Search}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        label="طلبات جديدة"
        value={summary.newMatchingRequests}
        highlight={summary.newMatchingRequests > 0}
      />
      <StatCard
        icon={MessageCircle}
        iconBg="bg-accent-50"
        iconColor="text-accent-600"
        label="رسائل جديدة"
        value={summary.unreadMessages}
        highlight={summary.unreadMessages > 0}
      />
      <StatCard
        icon={Star}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        label="متوسط التقييم"
        value={
          summary.avgRating > 0
            ? summary.avgRating.toString()
            : "—"
        }
        subtitle={
          summary.reviewsReceivedCount > 0
            ? `${summary.reviewsReceivedCount} تقييم`
            : undefined
        }
      />
      <StatCard
        icon={Briefcase}
        iconBg="bg-teal-50"
        iconColor="text-teal-600"
        label="خدمات نشطة"
        value={summary.activeServicesCount}
      />
      <StatCard
        icon={TrendingUp}
        iconBg="bg-green-50"
        iconColor="text-green-600"
        label="عروض أسعار معلقة"
        value={summary.myPendingQuotesCount}
      />
      <StatCard
        icon={CheckCircle2}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        label="مهام مكتملة"
        value={summary.completedJobsCount}
      />
      <StatCard
        icon={User}
        iconBg="bg-neutral-100"
        iconColor="text-neutral-600"
        label="الملف الشخصي"
        value={summary.isProfileComplete ? "مكتمل" : "غير مكتمل"}
        badge={
          summary.isProfileComplete
            ? { text: "مكتمل", variant: "success" as const }
            : { text: "غير مكتمل", variant: "warning" as const }
        }
      />
    </div>
  );
}

// ── Customer Stats Component ──
function CustomerStats({
  summary,
}: {
  summary: NonNullable<ReturnType<typeof useQuery<typeof api.dashboard.getSummary>>>;
}) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={ClipboardList}
        iconBg="bg-primary-50"
        iconColor="text-primary-600"
        label="مهام نشطة"
        value={summary.activeJobsCount}
      />
      <StatCard
        icon={FileText}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        label="طلبات مفتوحة"
        value={summary.openRequestsCount}
      />
      <StatCard
        icon={Clock}
        iconBg="bg-accent-50"
        iconColor="text-accent-600"
        label="عروض أسعار واردة"
        value={summary.pendingQuotesOnMyRequests}
        highlight={summary.pendingQuotesOnMyRequests > 0}
      />
      <StatCard
        icon={MessageCircle}
        iconBg="bg-purple-50"
        iconColor="text-purple-600"
        label="رسائل جديدة"
        value={summary.unreadMessages}
        highlight={summary.unreadMessages > 0}
      />
      <StatCard
        icon={CheckCircle2}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        label="مهام مكتملة"
        value={summary.completedJobsCount}
      />
      <StatCard
        icon={Star}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        label="تقييمات أرسلتها"
        value={summary.reviewsGivenCount}
      />
      <StatCard
        icon={FileText}
        iconBg="bg-neutral-100"
        iconColor="text-neutral-600"
        label="إجمالي الطلبات"
        value={summary.totalRequestsCount}
      />
      <StatCard
        icon={TrendingUp}
        iconBg="bg-green-50"
        iconColor="text-green-600"
        label="إجمالي المهام"
        value={summary.totalJobsCount}
      />
    </div>
  );
}

// ── Stat Card Component ──
function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  subtitle,
  highlight,
  badge,
}: {
  icon: typeof Star;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number | string;
  subtitle?: string;
  highlight?: boolean;
  badge?: { text: string; variant: "success" | "warning" };
}) {
  return (
    <Card className={highlight ? "ring-2 ring-primary-200 ring-offset-1" : ""}>
      <CardContent>
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-neutral-500 leading-tight mb-0.5">
              {label}
            </p>
            {badge ? (
              <Badge variant={badge.variant} className="text-[10px]">
                {badge.text}
              </Badge>
            ) : (
              <>
                <p className="text-xl font-bold text-foreground leading-tight">
                  {value}
                </p>
                {subtitle && (
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Quick Action Component ──
function QuickAction({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: typeof Star;
  label: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card hover className="!p-4">
        <CardContent>
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-foreground">
              {label}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Helper ──
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return new Date(timestamp).toLocaleDateString("ar-JO", {
    month: "short",
    day: "numeric",
  });
}
