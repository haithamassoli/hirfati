import { Hammer, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { AuthPanel } from "@/components/auth/auth-panel";
import { Card, CardContent } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth-server";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";

type AuthPageProps = {
  searchParams: Promise<{
    redirect?: string | string[] | undefined;
  }>;
};

const trustPoints = [
  {
    title: "دخول سريع",
    description: "حساب واحد يوصلك إلى الطلبات، الرسائل، والخدمات.",
    icon: Sparkles,
  },
  {
    title: "بنية موثوقة",
    description: "الجلسة مربوطة مع Convex وBetter Auth ضمن تدفق واحد.",
    icon: ShieldCheck,
  },
  {
    title: "جاهز للعمل",
    description: "انتقل من التصفح إلى التعاقد أو النشر خلال دقائق.",
    icon: Hammer,
  },
];

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { redirect: redirectParam } = await searchParams;
  const redirectTo = sanitizeRedirectPath(redirectParam);

  if (await isAuthenticated()) {
    redirect(redirectTo);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.15),transparent_28rem),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.16),transparent_24rem)]" />
        <div className="absolute inset-y-0 left-1/2 hidden w-px bg-gradient-to-b from-transparent via-primary-100 to-transparent lg:block" />

        <section className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-stretch gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-primary-100 bg-gradient-to-bl from-white via-primary-50/70 to-accent-50/80 p-8 shadow-xl shadow-primary-900/5 md:p-10">
              <div className="absolute left-0 top-0 h-40 w-40 -translate-x-10 -translate-y-10 rounded-full bg-accent-200/60 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-40 w-40 translate-x-12 translate-y-10 rounded-full bg-primary-200/70 blur-3xl" />

              <div className="relative space-y-8">
                <div className="space-y-5">
                  <Badge variant="primary" className="w-fit">
                    <Wrench className="h-3.5 w-3.5" />
                    بوابة الدخول إلى حرفتي
                  </Badge>

                  <div className="max-w-2xl space-y-4">
                    <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl">
                      حساب واحد يربطك
                      <span className="block text-primary-600">
                        بورش الأردن وفرصه
                      </span>
                    </h1>
                    <p className="text-base leading-8 text-neutral-600 md:text-lg">
                      سواء كنت تبحث عن حرفي موثوق أو تريد استقبال طلبات جديدة،
                      صفحة الدخول هذه هي نقطة العبور المنظّمة إلى كل ما بعد
                      التصفح.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {trustPoints.map((point) => (
                    <Card
                      key={point.title}
                      className="rounded-[1.5rem] border-white/70 bg-white/80 p-0 shadow-lg shadow-primary-900/5 backdrop-blur"
                    >
                      <CardContent className="space-y-3 p-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-md shadow-primary-900/20">
                          <point.icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <h2 className="font-semibold text-foreground">
                            {point.title}
                          </h2>
                          <p className="text-sm leading-6 text-neutral-600">
                            {point.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="rounded-[1.75rem] border border-primary-100 bg-neutral-950 p-6 text-white shadow-xl shadow-neutral-950/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-400 text-neutral-950">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-primary-100">تجربة دخول عملية</p>
                      <p className="text-xl font-semibold">
                        لا نماذج طويلة ولا خطوات مشتتة
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {[
                      "1. ادخل بحساب Google",
                      "2. يتم تهيئة الجلسة تلقائياً",
                      "3. تعود مباشرة إلى مسارك داخل المنصة",
                    ].map((step) => (
                      <div
                        key={step}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-primary-50"
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <AuthPanel redirectTo={redirectTo} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
