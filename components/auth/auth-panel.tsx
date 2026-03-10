"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/auth-redirect";

function getDestinationLabel(redirectTo: string) {
  if (redirectTo.startsWith("/dashboard/requests/new")) {
    return "نموذج طلب الخدمة";
  }

  if (redirectTo.startsWith("/dashboard/requests")) {
    return "طلباتك";
  }

  if (redirectTo.startsWith("/dashboard/jobs")) {
    return "مهامك";
  }

  if (redirectTo.startsWith("/dashboard")) {
    return "لوحة التحكم";
  }

  if (redirectTo.startsWith("/providers/")) {
    return "صفحة الحرفي";
  }

  if (redirectTo.startsWith("/requests/")) {
    return "تفاصيل الطلب";
  }

  return "الصفحة المطلوبة";
}

export function AuthPanel({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && session?.session) {
      router.replace(redirectTo);
    }
  }, [isPending, redirectTo, router, session]);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });

      const maybeError =
        result &&
        typeof result === "object" &&
        "error" in result &&
        result.error &&
        typeof result.error === "object" &&
        "message" in result.error &&
        typeof result.error.message === "string"
          ? result.error.message
          : null;

      if (maybeError) {
        setErrorMessage(maybeError);
      }
    } catch {
      setErrorMessage("تعذر بدء تسجيل الدخول الآن. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRedirecting = !isPending && Boolean(session?.session);

  return (
    <Card className="relative overflow-hidden rounded-[2rem] border-primary-100 bg-surface/95 p-0 shadow-xl shadow-primary-900/10 backdrop-blur">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-accent-400 via-primary-400 to-primary-600" />

      <CardContent className="space-y-6 p-8 md:p-10">
        <div className="space-y-4">
          <Badge variant="accent" className="w-fit">
            <ShieldCheck className="h-3.5 w-3.5" />
            دخول آمن عبر Google
          </Badge>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              ادخل إلى حسابك وابدأ العمل مباشرة
            </h2>
            <p className="text-sm leading-7 text-neutral-600 md:text-base">
              نستخدم تسجيل الدخول عبر Google لتسريع البداية وربط حسابك بالمنصة
              بأمان.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4">
          <p className="text-xs font-medium text-primary-700">بعد تسجيل الدخول</p>
          <p className="mt-1 text-sm text-primary-900">
            سننقلك إلى {getDestinationLabel(redirectTo)}.
          </p>
        </div>

        <Button
          size="lg"
          className="w-full justify-center rounded-2xl py-4 text-base"
          onClick={handleGoogleSignIn}
          isLoading={isSubmitting || isRedirecting}
          disabled={isPending || isSubmitting || isRedirecting}
        >
          <Sparkles className="h-5 w-5" />
          {isRedirecting ? "جار تحويلك..." : "المتابعة باستخدام Google"}
        </Button>

        {errorMessage && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="space-y-3 rounded-2xl border border-border bg-neutral-50 p-5">
          {[
            "إعداد الحساب وربطه بملفك الشخصي يتم تلقائياً.",
            "بيانات الجلسة محفوظة عبر Better Auth وConvex.",
            "يمكنك التبديل بين دور العميل والحرفي بعد الدخول.",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 text-sm text-neutral-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-2 text-sm">
          <Link
            href="/"
            className="text-neutral-500 transition-colors hover:text-foreground"
          >
            العودة إلى الرئيسية
          </Link>

          <Link
            href={redirectTo === DEFAULT_AUTH_REDIRECT ? "/dashboard" : redirectTo}
            className="inline-flex items-center gap-1 text-primary-600 transition-colors hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            معاينة الوجهة
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
