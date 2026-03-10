"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CategoryIcon } from "@/components/ui/category-icon";
import { StarRating } from "@/components/ui/star-rating";
import { buildAuthHref } from "@/lib/auth-redirect";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PremiumBanner } from "@/components/premium/premium-banner";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import * as m from "motion/react-client";
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
import { useRouter } from "next/navigation";
import { useState } from "react";

const stats = [
  { label: "حرفي مسجل", value: "+500", icon: Users },
  { label: "طلب خدمة", value: "+2,000", icon: Clock },
  { label: "تقييم إيجابي", value: "4.8", icon: Star },
  { label: "ضمان الجودة", value: "100%", icon: Shield },
];

export default function HomePage() {
  const categories = useQuery(api.categories.listMain);
  const featuredProviders = useQuery(api.providers.listFeatured);
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-primary-50 via-background to-accent-50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary-200 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-accent-200 rounded-full blur-3xl" />
        </div>

        <m.div
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-3xl mx-auto text-center">
            <m.div variants={fadeInUp}>
              <Badge variant="primary" className="mb-6">
                منصة #1 للحرفيين في الأردن
              </Badge>
            </m.div>

            <m.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
            >
              اعثر على{" "}
              <span className="text-primary-500">أفضل الحرفيين</span> بالقرب
              منك
            </m.h1>

            <m.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              سباكة، كهرباء، نجارة، حدادة وأكثر. احصل على عروض أسعار مجانية من
              حرفيين موثوقين في عمّان، إربد والزرقاء.
            </m.p>

            {/* Search Bar */}
            <m.form variants={fadeInUp} onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex gap-2 bg-surface rounded-2xl p-2 shadow-lg border border-border">
                <div className="flex-1 relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="ابحث عن خدمة... مثال: إصلاح حنفية"
                    className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-transparent text-foreground placeholder:text-neutral-400 focus:outline-none text-sm"
                  />
                </div>
                <Button type="submit" size="lg" className="rounded-xl px-8">
                  ابحث
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-neutral-500">
                <span>الأكثر بحثاً:</span>
                <Link
                  href="/search?q=سباكة"
                  className="text-primary-600 hover:underline"
                >
                  سباكة
                </Link>
                <span>·</span>
                <Link
                  href="/search?q=كهرباء"
                  className="text-primary-600 hover:underline"
                >
                  كهرباء
                </Link>
                <span>·</span>
                <Link
                  href="/search?q=دهان"
                  className="text-primary-600 hover:underline"
                >
                  دهان
                </Link>
              </div>
            </m.form>
          </div>
        </m.div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">
              تصفح حسب التصنيف
            </h2>
            <p className="text-neutral-500">اختر نوع الخدمة التي تحتاجها</p>
          </m.div>

          <m.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
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
                <m.div key={cat._id} variants={fadeInUp}>
                  <Link href={`/categories/${cat.slug}`}>
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
                </m.div>
              );
            })}
          </m.div>

          <m.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/categories">
              <Button variant="outline" size="lg">
                عرض جميع التصنيفات
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          </m.div>
        </div>
      </section>

      {/* Featured Providers */}
      {featuredProviders && featuredProviders.length > 0 && (
        <section className="py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <m.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-3">
                حرفيون مميزون
              </h2>
              <p className="text-neutral-500">
                أفضل الحرفيين تقييماً على المنصة
              </p>
            </m.div>

            <m.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {featuredProviders.map((provider) => (
                <m.div key={provider._id} variants={fadeInUp}>
                  <Link href={`/providers/${provider._id}`}>
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
                </m.div>
              ))}
            </m.div>
          </div>
        </section>
      )}

      {/* Premium Banner */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PremiumBanner title="حرفيون مميزون يوصى بهم" limit={4} />
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat) => (
              <m.div key={stat.label} className="text-center" variants={fadeInUp}>
                <stat.icon className="h-8 w-8 text-primary-200 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-primary-200 text-sm">{stat.label}</div>
              </m.div>
            ))}
          </m.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">
              كيف تعمل حرفتي؟
            </h2>
            <p className="text-neutral-500">
              ثلاث خطوات بسيطة للحصول على الخدمة
            </p>
          </m.div>

          <m.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
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
              <m.div key={item.step} className="text-center" variants={fadeInUp}>
                <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-neutral-500 leading-relaxed">{item.desc}</p>
              </m.div>
            ))}
          </m.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-bl from-primary-600 to-primary-800">
        <m.div
          className="max-w-4xl mx-auto px-4 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
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
            onClick={() => router.push(buildAuthHref("/dashboard"))}
          >
            سجّل كحرفي مجاناً
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </m.div>
      </section>

      <Footer />
    </div>
  );
}
