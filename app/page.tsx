"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CategoryIcon } from "@/components/ui/category-icon";
import { StarRating } from "@/components/ui/star-rating";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Search,
  ArrowLeft,
  Star,
  Shield,
  Clock,
  Users,
  ChevronLeft,
  MapPin,
  Crown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const stats = [
  { label: "حرفي مسجل", value: "+500", icon: Users },
  { label: "طلب خدمة", value: "+2,000", icon: Clock },
  { label: "تقييم إيجابي", value: "4.8", icon: Star },
  { label: "ضمان الجودة", value: "100%", icon: Shield },
];

export default function HomePage() {
  const categories = useQuery(api.categories.listMain);
  const featuredProviders = useQuery(api.providers.listFeatured);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-primary-50 via-background to-accent-50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary-200 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-accent-200 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="primary" className="mb-6">
              منصة #1 للحرفيين في الأردن
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              اعثر على{" "}
              <span className="text-primary-500">أفضل الحرفيين</span> بالقرب
              منك
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              سباكة، كهرباء، نجارة، حدادة وأكثر. احصل على عروض أسعار مجانية من
              حرفيين موثوقين في عمّان، إربد والزرقاء.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 bg-surface rounded-2xl p-2 shadow-lg border border-border">
                <div className="flex-1 relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="ابحث عن خدمة... مثال: إصلاح حنفية"
                    className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-transparent text-foreground placeholder:text-neutral-400 focus:outline-none text-sm"
                  />
                </div>
                <Button size="lg" className="rounded-xl px-8">
                  ابحث
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-neutral-500">
                <span>الأكثر بحثاً:</span>
                <Link
                  href="/categories/plumbing"
                  className="text-primary-600 hover:underline"
                >
                  سباكة
                </Link>
                <span>·</span>
                <Link
                  href="/categories/electrical"
                  className="text-primary-600 hover:underline"
                >
                  كهرباء
                </Link>
                <span>·</span>
                <Link
                  href="/categories/painting"
                  className="text-primary-600 hover:underline"
                >
                  دهان
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              تصفح حسب التصنيف
            </h2>
            <p className="text-neutral-500">اختر نوع الخدمة التي تحتاجها</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(categories ?? []).map((cat) => {
              const colorMap: Record<string, string> = {
                plumbing: "bg-blue-50 text-blue-600",
                electrical: "bg-amber-50 text-amber-600",
                carpentry: "bg-orange-50 text-orange-600",
                blacksmithing: "bg-neutral-100 text-neutral-700",
                painting: "bg-pink-50 text-pink-600",
                hvac: "bg-cyan-50 text-cyan-600",
                "tiling-flooring": "bg-emerald-50 text-emerald-600",
                "general-maintenance": "bg-violet-50 text-violet-600",
              };
              const color = colorMap[cat.slug] ?? "bg-neutral-100 text-neutral-600";

              return (
                <Link key={cat._id} href={`/categories/${cat.slug}`}>
                  <Card hover className="text-center group">
                    <CardContent className="flex flex-col items-center gap-4 py-2">
                      <div
                        className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
                      >
                        <CategoryIcon icon={cat.icon} className="h-7 w-7" />
                      </div>
                      <span className="font-semibold text-foreground">
                        {cat.nameAr}
                      </span>
                      <div className="flex items-center gap-1 text-primary-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>عرض الحرفيين</span>
                        <ChevronLeft className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link href="/categories">
              <Button variant="outline" size="lg">
                عرض جميع التصنيفات
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      {featuredProviders && featuredProviders.length > 0 && (
        <section className="py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3">
                حرفيون مميزون
              </h2>
              <p className="text-neutral-500">
                أفضل الحرفيين تقييماً على المنصة
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProviders.map((provider) => (
                <Link key={provider._id} href={`/providers/${provider._id}`}>
                  <Card hover className="text-center group">
                    <CardContent className="flex flex-col items-center gap-3 py-4">
                      {provider.isPremium && (
                        <Badge variant="premium" className="mb-1">
                          <Crown className="h-3 w-3" />
                          مميز
                        </Badge>
                      )}
                      <div className="relative">
                        {provider.avatarUrl ? (
                          <Image
                            src={provider.avatarUrl}
                            alt={provider.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-full object-cover border-2 border-border"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
                            {provider.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {provider.name}
                      </h3>
                      {provider.bio && (
                        <p className="text-xs text-neutral-500 line-clamp-2">
                          {provider.bio}
                        </p>
                      )}
                      <StarRating rating={provider.avgRating} size="sm" />
                      {provider.serviceArea &&
                        provider.serviceArea.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-neutral-500">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {provider.serviceArea
                                .map((c) =>
                                  c === "amman"
                                    ? "عمّان"
                                    : c === "irbid"
                                      ? "إربد"
                                      : "الزرقاء"
                                )
                                .join("، ")}
                            </span>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="py-16 bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-8 w-8 text-primary-200 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-primary-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              كيف تعمل حرفتي؟
            </h2>
            <p className="text-neutral-500">
              ثلاث خطوات بسيطة للحصول على الخدمة
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "١",
                title: "اطلب خدمة",
                desc: "صف ما تحتاجه، حدد الميزانية والموقع، وأرفق صور إن أردت.",
              },
              {
                step: "٢",
                title: "استلم عروض الأسعار",
                desc: "حرفيون موثوقون يتنافسون لتقديم أفضل عرض سعر لك.",
              },
              {
                step: "٣",
                title: "اختر وابدأ",
                desc: "قارن العروض والتقييمات، اختر الأنسب، وتواصل مباشرة.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-neutral-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-bl from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            أنت حرفي؟ انضم إلينا اليوم
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            سجّل مجاناً، أنشئ ملفك الشخصي، واستقبل طلبات العمل من عملاء حقيقيين
            في مدينتك.
          </p>
          <Button
            variant="accent"
            size="lg"
            className="text-base"
            onClick={() =>
              authClient.signIn.social({
                provider: "google",
                callbackURL: "/dashboard",
              })
            }
          >
            سجّل كحرفي مجاناً
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
