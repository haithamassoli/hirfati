"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { PremiumBadge } from "@/components/ui/premium-badge";
import {
  Crown,
  Zap,
  TrendingUp,
  Eye,
  Shield,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  MegaphoneIcon,
} from "lucide-react";
import { useState } from "react";

type PlanType = "visibility_boost" | "ad";
type Duration = 7 | 30;

interface Plan {
  type: PlanType;
  duration: Duration;
  title: string;
  price: number;
  perDay: number;
  features: string[];
  icon: typeof Zap;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    type: "visibility_boost",
    duration: 7,
    title: "تعزيز الظهور - أسبوع",
    price: 5,
    perDay: 0.71,
    icon: TrendingUp,
    features: [
      "ظهور في أعلى نتائج البحث",
      "شارة حرفي مميز على ملفك",
      "أولوية في صفحات التصنيفات",
      "صلاحية 7 أيام",
    ],
  },
  {
    type: "visibility_boost",
    duration: 30,
    title: "تعزيز الظهور - شهر",
    price: 15,
    perDay: 0.5,
    icon: Zap,
    popular: true,
    features: [
      "ظهور في أعلى نتائج البحث",
      "شارة حرفي مميز على ملفك",
      "أولوية في صفحات التصنيفات",
      "توفير 30% مقارنة بالأسبوعي",
      "صلاحية 30 يوم",
    ],
  },
  {
    type: "ad",
    duration: 7,
    title: "إعلان مميز - أسبوع",
    price: 10,
    perDay: 1.43,
    icon: MegaphoneIcon,
    features: [
      "بانر إعلاني في الصفحة الرئيسية",
      "ظهور في صفحات التصنيفات",
      "شارة حرفي مميز",
      "أولوية في نتائج البحث",
      "صلاحية 7 أيام",
    ],
  },
  {
    type: "ad",
    duration: 30,
    title: "إعلان مميز - شهر",
    price: 30,
    perDay: 1.0,
    icon: Sparkles,
    features: [
      "بانر إعلاني في الصفحة الرئيسية",
      "ظهور في صفحات التصنيفات",
      "شارة حرفي مميز",
      "أولوية في نتائج البحث",
      "توفير 25% مقارنة بالأسبوعي",
      "صلاحية 30 يوم",
    ],
  },
];

const statusLabels: Record<string, string> = {
  pending: "بانتظار التفعيل",
  active: "نشط",
  expired: "منتهي",
};

const statusVariants: Record<string, "warning" | "success" | "default"> = {
  pending: "warning",
  active: "success",
  expired: "default",
};

const typeLabels: Record<string, string> = {
  visibility_boost: "تعزيز الظهور",
  ad: "إعلان مميز",
};

export default function PremiumPage() {
  const premiumInfo = useQuery(api.premium.getMyPremiumInfo);
  const createOrder = useMutation(api.premium.createOrder);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (premiumInfo === undefined) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleOrder = async (plan: Plan) => {
    setIsSubmitting(true);
    setSuccessMessage("");
    try {
      await createOrder({ type: plan.type, duration: plan.duration });
      setSuccessMessage(
        "تم إنشاء الطلب بنجاح! سيتم تفعيله بعد مراجعة الإدارة."
      );
      setSelectedPlan(null);
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء إنشاء الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-bl from-accent-400 to-accent-600 mb-4 shadow-lg">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          الباقات المميزة
        </h1>
        <p className="text-neutral-500 max-w-lg mx-auto">
          عزّز ظهورك واحصل على المزيد من العملاء. اختر الباقة المناسبة لك.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="bg-success-light border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Active subscription banner */}
      {premiumInfo?.isActive && premiumInfo.activeOrder && (
        <Card className="border-accent-200 bg-gradient-to-l from-accent-50 via-white to-accent-50">
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-bl from-accent-400 to-accent-500 flex items-center justify-center shrink-0">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    اشتراكك المميز نشط
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {typeLabels[premiumInfo.activeOrder.type]} · متبقي{" "}
                    {premiumInfo.activeOrder.daysRemaining} يوم
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PremiumBadge size="lg" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
                <span>
                  {new Date(premiumInfo.activeOrder.startDate).toLocaleDateString("ar-JO")}
                </span>
                <span>
                  {new Date(premiumInfo.activeOrder.endDate).toLocaleDateString("ar-JO")}
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-accent-400 to-accent-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      5,
                      ((premiumInfo.activeOrder.endDate - Date.now()) /
                        (premiumInfo.activeOrder.endDate -
                          premiumInfo.activeOrder.startDate)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Eye,
            title: "ظهور أعلى",
            desc: "ملفك يظهر أولاً في نتائج البحث والتصنيفات",
          },
          {
            icon: Star,
            title: "شارة مميزة",
            desc: "شارة ذهبية تزيد ثقة العملاء في خدماتك",
          },
          {
            icon: TrendingUp,
            title: "عملاء أكثر",
            desc: "زيادة في عدد الطلبات والتواصل من العملاء",
          },
        ].map((benefit) => (
          <div
            key={benefit.title}
            className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-border"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <benefit.icon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                {benefit.title}
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5">{benefit.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">
          اختر باقتك
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan;
            return (
              <div
                key={`${plan.type}-${plan.duration}`}
                className={`relative rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-accent-400 bg-accent-50/30 shadow-lg shadow-accent-100"
                    : "border-border bg-surface hover:border-neutral-300 hover:shadow-md"
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-l from-accent-400 to-accent-500 text-white shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      الأكثر طلباً
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan icon + title */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        plan.type === "ad"
                          ? "bg-accent-100 text-accent-600"
                          : "bg-primary-100 text-primary-600"
                      }`}
                    >
                      <plan.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {plan.title}
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {plan.duration} يوم
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-sm text-neutral-500">د.أ</span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {plan.perDay.toFixed(2)} د.أ / يوم
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-neutral-600"
                      >
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    variant={isSelected ? "accent" : "secondary"}
                    className="w-full"
                    isLoading={isSubmitting && isSelected}
                    disabled={isSubmitting}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrder(plan);
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Crown className="h-4 w-4" />
                        طلب الاشتراك
                      </>
                    ) : (
                      "اختيار هذه الباقة"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-neutral-50 rounded-2xl border border-border p-6 sm:p-8">
        <h3 className="text-lg font-bold text-foreground mb-4 text-center">
          كيف يعمل الاشتراك المميز؟
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "١",
              title: "اختر باقتك",
              desc: "حدد نوع الباقة ومدتها المناسبة لاحتياجاتك",
            },
            {
              step: "٢",
              title: "تفعيل الطلب",
              desc: "سيقوم فريقنا بمراجعة وتفعيل طلبك خلال ساعات",
            },
            {
              step: "٣",
              title: "استمتع بالمزايا",
              desc: "ملفك يظهر أولاً وتحصل على المزيد من العملاء",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-lg font-bold mx-auto mb-3">
                {item.step}
              </div>
              <h4 className="font-semibold text-foreground text-sm mb-1">
                {item.title}
              </h4>
              <p className="text-xs text-neutral-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment note */}
      <div className="flex items-start gap-3 bg-info-light border border-blue-200 rounded-xl p-4">
        <Shield className="h-5 w-5 text-info shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">ملاحظة الدفع</p>
          <p className="text-xs text-blue-700 mt-0.5">
            حالياً يتم الدفع عبر التحويل البنكي أو التواصل المباشر مع فريق
            الدعم. سيتم إضافة الدفع الإلكتروني قريباً.
          </p>
        </div>
      </div>

      {/* Order History */}
      {premiumInfo && premiumInfo.orderHistory.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            سجل الطلبات
          </h2>
          <div className="space-y-3">
            {premiumInfo.orderHistory.map((order) => (
              <Card key={order._id}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                        {order.type === "ad" ? (
                          <MegaphoneIcon className="h-5 w-5 text-neutral-500" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-neutral-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {typeLabels[order.type]}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {order.duration} يوم
                          {order.startDate > 0 && (
                            <>
                              {" "}
                              · من{" "}
                              {new Date(order.startDate).toLocaleDateString(
                                "ar-JO"
                              )}{" "}
                              إلى{" "}
                              {new Date(order.endDate).toLocaleDateString(
                                "ar-JO"
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariants[order.status] ?? "default"}>
                      {order.status === "active" && (
                        <Clock className="h-3 w-3" />
                      )}
                      {statusLabels[order.status] ?? order.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
