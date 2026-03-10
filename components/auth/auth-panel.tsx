"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

type Tab = "signin" | "signup";

function getDestinationLabel(redirectTo: string) {
  if (redirectTo.startsWith("/dashboard/requests/new")) return "نموذج طلب الخدمة";
  if (redirectTo.startsWith("/dashboard/requests")) return "طلباتك";
  if (redirectTo.startsWith("/dashboard/jobs")) return "مهامك";
  if (redirectTo.startsWith("/dashboard")) return "لوحة التحكم";
  if (redirectTo.startsWith("/providers/")) return "صفحة الحرفي";
  if (redirectTo.startsWith("/requests/")) return "تفاصيل الطلب";
  return "الصفحة المطلوبة";
}

function FieldError({ errors }: { errors: unknown[] }) {
  const first = errors[0];
  if (!first) return null;
  const text =
    typeof first === "string"
      ? first
      : (first as { message?: string })?.message ?? String(first);
  return (
    <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {text}
    </p>
  );
}

function TextInput({
  name,
  type,
  placeholder,
  autoComplete,
  value,
  onChange,
  onBlur,
  hasError,
  icon: Icon,
  rightSlot,
}: {
  name: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  hasError: boolean;
  icon: React.ComponentType<{ className?: string }>;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none z-10" />
      <input
        id={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          "w-full pr-10 py-2.5 text-sm rounded-xl border bg-white text-foreground",
          "placeholder:text-neutral-400 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent",
          rightSlot ? "pl-10" : "pl-4",
          hasError
            ? "border-red-300"
            : "border-border hover:border-border-hover",
        )}
      />
      {rightSlot && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
  );
}

function OrDivider() {
  return (
    <div className="relative flex items-center gap-3 py-1">
      <div className="flex-1 border-t border-border" />
      <span className="text-xs text-neutral-400">أو</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

function GoogleButton({
  isLoading,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full justify-center rounded-xl gap-2"
      onClick={onClick}
      isLoading={isLoading}
      disabled={isLoading}
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      المتابعة باستخدام Google
    </Button>
  );
}

function SignInForm({
  redirectTo,
  onGoogleSignIn,
  isGoogleLoading,
}: {
  redirectTo: string;
  onGoogleSignIn: () => void;
  isGoogleLoading: boolean;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const result = await authClient.signIn.email({
        email: value.email,
        password: value.password,
        callbackURL: redirectTo,
      });
      if (result?.error) {
        setServerError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      } else {
        router.replace(redirectTo);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => {
            const r = z
              .string()
              .min(1, "البريد الإلكتروني مطلوب")
              .email("بريد إلكتروني غير صالح")
              .safeParse(value);
            return r.success ? undefined : r.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <div>
            <TextInput
              name={field.name}
              type="email"
              autoComplete="email"
              placeholder="البريد الإلكتروني"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              hasError={field.state.meta.errors.length > 0}
              icon={Mail}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) => {
            if (!value) return "كلمة المرور مطلوبة";
            return undefined;
          },
        }}
      >
        {(field) => (
          <div>
            <TextInput
              name={field.name}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="كلمة المرور"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              hasError={field.state.meta.errors.length > 0}
              icon={Lock}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      {serverError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            size="lg"
            className="w-full justify-center rounded-xl"
            disabled={!canSubmit}
            isLoading={isSubmitting}
          >
            دخول
          </Button>
        )}
      </form.Subscribe>

      <OrDivider />
      <GoogleButton isLoading={isGoogleLoading} onClick={onGoogleSignIn} />
    </form>
  );
}

function SignUpForm({
  redirectTo,
  onGoogleSignIn,
  isGoogleLoading,
}: {
  redirectTo: string;
  onGoogleSignIn: () => void;
  isGoogleLoading: boolean;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      if (value.password !== value.confirmPassword) {
        setServerError("كلمة المرور وتأكيدها غير متطابقتين.");
        return;
      }
      const result = await authClient.signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
        callbackURL: redirectTo,
      });
      if (result?.error) {
        const msg = result.error.message ?? "";
        if (msg.toLowerCase().includes("exist") || msg.toLowerCase().includes("taken")) {
          setServerError("هذا البريد الإلكتروني مسجل مسبقاً. جرّب تسجيل الدخول.");
        } else {
          setServerError("تعذر إنشاء الحساب. حاول مرة أخرى.");
        }
      } else {
        router.replace(redirectTo);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => {
            const r = z
              .string()
              .min(2, "الاسم يجب أن يكون حرفين على الأقل")
              .max(60, "الاسم طويل جداً")
              .safeParse(value);
            return r.success ? undefined : r.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <div>
            <TextInput
              name={field.name}
              type="text"
              autoComplete="name"
              placeholder="الاسم الكامل"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              hasError={field.state.meta.errors.length > 0}
              icon={User}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => {
            const r = z
              .string()
              .min(1, "البريد الإلكتروني مطلوب")
              .email("بريد إلكتروني غير صالح")
              .safeParse(value);
            return r.success ? undefined : r.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <div>
            <TextInput
              name={field.name}
              type="email"
              autoComplete="email"
              placeholder="البريد الإلكتروني"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              hasError={field.state.meta.errors.length > 0}
              icon={Mail}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) => {
            const r = z
              .string()
              .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
              .safeParse(value);
            return r.success ? undefined : r.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <div>
            <TextInput
              name={field.name}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="كلمة المرور (8 أحرف على الأقل)"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              hasError={field.state.meta.errors.length > 0}
              icon={Lock}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Field
        name="confirmPassword"
        validators={{
          onChange: ({ value, fieldApi }) => {
            if (!value) return undefined;
            const password = fieldApi.form.getFieldValue("password");
            if (value !== password) return "كلمة المرور وتأكيدها غير متطابقتين";
            return undefined;
          },
          onBlur: ({ value, fieldApi }) => {
            if (!value) return "تأكيد كلمة المرور مطلوب";
            const password = fieldApi.form.getFieldValue("password");
            if (value !== password) return "كلمة المرور وتأكيدها غير متطابقتين";
            return undefined;
          },
        }}
      >
        {(field) => (
          <div>
            <TextInput
              name={field.name}
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="تأكيد كلمة المرور"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              hasError={field.state.meta.errors.length > 0}
              icon={Lock}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      {serverError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            size="lg"
            className="w-full justify-center rounded-xl"
            disabled={!canSubmit}
            isLoading={isSubmitting}
          >
            إنشاء حساب
          </Button>
        )}
      </form.Subscribe>

      <OrDivider />
      <GoogleButton isLoading={isGoogleLoading} onClick={onGoogleSignIn} />
    </form>
  );
}

export function AuthPanel({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<Tab>("signin");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && session?.session) {
      router.replace(redirectTo);
    }
  }, [isPending, redirectTo, router, session]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });
      const err =
        result &&
        typeof result === "object" &&
        "error" in result &&
        result.error &&
        typeof result.error === "object" &&
        "message" in result.error &&
        typeof result.error.message === "string"
          ? result.error.message
          : null;
      if (err) setGoogleError(err);
    } catch {
      setGoogleError("تعذر بدء تسجيل الدخول الآن. حاول مرة أخرى.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="relative overflow-hidden rounded-[2rem] border-primary-100 bg-surface/95 p-0 shadow-xl shadow-primary-900/10 backdrop-blur">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-accent-400 via-primary-400 to-primary-600" />

      <CardContent className="space-y-5 p-8 md:p-10">
        {/* Header */}
        <div className="space-y-3">
          <Badge variant="accent" className="w-fit">
            <ShieldCheck className="h-3.5 w-3.5" />
            دخول آمن إلى حرفتي
          </Badge>
          <h2 className="text-2xl font-bold text-foreground">
            {activeTab === "signin" ? "مرحباً مجدداً" : "انضم إلى حرفتي"}
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-neutral-100 p-1 gap-1">
          {(["signin", "signup"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200",
                activeTab === tab
                  ? "bg-white text-foreground shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700",
              )}
            >
              {tab === "signin" ? "دخول" : "تسجيل"}
            </button>
          ))}
        </div>

        {/* Redirect destination info */}
        <div className="rounded-2xl border border-primary-100 bg-primary-50/70 px-4 py-3">
          <p className="text-xs font-medium text-primary-700">
            بعد {activeTab === "signin" ? "تسجيل الدخول" : "إنشاء الحساب"}
          </p>
          <p className="mt-0.5 text-sm text-primary-900">
            سننقلك إلى {getDestinationLabel(redirectTo)}.
          </p>
        </div>

        {/* Forms */}
        {activeTab === "signin" ? (
          <SignInForm
            redirectTo={redirectTo}
            onGoogleSignIn={handleGoogleSignIn}
            isGoogleLoading={isGoogleLoading}
          />
        ) : (
          <SignUpForm
            redirectTo={redirectTo}
            onGoogleSignIn={handleGoogleSignIn}
            isGoogleLoading={isGoogleLoading}
          />
        )}

        {googleError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {googleError}
          </div>
        )}

        {/* Demo credentials hint */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-500 space-y-1">
          <p className="font-medium text-neutral-600">حسابات تجريبية</p>
          <p>
            <span className="font-mono">ahmad.provider@hirfati.dev</span>
            {" · "}
            <span className="font-mono">Hirfati123!</span>
          </p>
          <p>
            <span className="font-mono">sara.customer@hirfati.dev</span>
            {" · "}
            <span className="font-mono">Hirfati123!</span>
          </p>
        </div>

        {/* Footer links */}
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
