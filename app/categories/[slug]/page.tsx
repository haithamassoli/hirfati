"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/ui/category-icon";
import { StarRating } from "@/components/ui/star-rating";
import { ProviderCardSkeleton } from "@/components/ui/skeleton";
import { cityLabels } from "@/lib/constants";
import { PremiumBanner } from "@/components/premium/premium-banner";
import {
  MapPin,
  Crown,
  Briefcase,
  ChevronLeft,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { use, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

type City = "amman" | "irbid" | "zarqa";

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [selectedCity, setSelectedCity] = useState<City | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minRating, setMinRating] = useState<number | undefined>();

  const category = useQuery(api.categories.getBySlug, { slug });
  const subcategories = useQuery(
    api.categories.getSubcategories,
    category ? { parentId: category._id } : "skip"
  );
  const providers = useQuery(
    api.providers.list,
    category
      ? { categoryId: category._id as Id<"categories">, city: selectedCity }
      : "skip"
  );

  if (category === undefined) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProviderCardSkeleton key={i} />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (category === null) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            التصنيف غير موجود
          </h1>
          <p className="text-neutral-500 mb-6">
            عذراً، لم نتمكن من العثور على هذا التصنيف.
          </p>
          <Link href="/categories">
            <Button variant="primary">العودة للتصنيفات</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const cities: { value: City | undefined; label: string }[] = [
    { value: undefined, label: "جميع المدن" },
    { value: "amman", label: "عمّان" },
    { value: "irbid", label: "إربد" },
    { value: "zarqa", label: "الزرقاء" },
  ];

  const filteredProviders = (providers ?? []).filter((p) => {
    if (minRating && p.avgRating < minRating) return false;
    const pMin = Number(minPrice);
    const pMax = Number(maxPrice);
    if (pMin > 0 && p.maxPrice < pMin) return false;
    if (pMax > 0 && p.minPrice > pMax) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-bl from-primary-50 via-background to-accent-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              الرئيسية
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <Link
              href="/categories"
              className="hover:text-foreground transition-colors"
            >
              التصنيفات
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground">{category.nameAr}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <CategoryIcon icon={category.icon} className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {category.nameAr}
              </h1>
              <p className="text-neutral-500 mt-1">{category.name}</p>
            </div>
          </div>

          {/* Subcategories */}
          {subcategories && subcategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {subcategories.map((sub) => (
                <Link key={sub._id} href={`/categories/${sub.slug}`}>
                  <Badge
                    variant="default"
                    className="cursor-pointer hover:bg-primary-50 hover:text-primary-600 transition-colors"
                  >
                    {sub.nameAr}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Filters + Providers */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="space-y-4 mb-8">
            {/* City Filter + Toggle */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <MapPin className="h-4 w-4 text-neutral-500 shrink-0" />
              {cities.map((city) => (
                <button
                  key={city.label}
                  onClick={() => setSelectedCity(city.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCity === city.value
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {city.label}
                </button>
              ))}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer mr-auto ${
                  showFilters || minRating || minPrice || maxPrice
                    ? "bg-primary-100 text-primary-700 border border-primary-200"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                فلاتر إضافية
              </button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="bg-neutral-50 rounded-xl border border-border p-5 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      نطاق السعر (د.أ)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="الحد الأدنى"
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                      <span className="text-neutral-400">—</span>
                      <input
                        type="number"
                        min={0}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="الحد الأعلى"
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {/* Minimum Rating */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      الحد الأدنى للتقييم
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: undefined, label: "الكل" },
                        { value: 4, label: "4+" },
                        { value: 3, label: "3+" },
                        { value: 2, label: "2+" },
                      ].map((option) => (
                        <button
                          key={option.label}
                          onClick={() => setMinRating(option.value)}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                            minRating === option.value
                              ? "bg-primary-500 text-white"
                              : "bg-surface text-neutral-600 border border-border hover:bg-neutral-100"
                          }`}
                        >
                          {option.value && (
                            <Star className="h-3.5 w-3.5 fill-current" />
                          )}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear filters */}
                {(minPrice || maxPrice || minRating) && (
                  <button
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                      setMinRating(undefined);
                    }}
                    className="mt-4 text-sm text-primary-600 hover:text-primary-700 cursor-pointer"
                  >
                    مسح الفلاتر
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Premium Providers Banner */}
          {category && (
            <div className="mb-8">
              <PremiumBanner
                categoryId={category._id as Id<"categories">}
                title={`حرفيون مميزون - ${category.nameAr}`}
                limit={4}
              />
            </div>
          )}

          {/* Providers Grid */}
          {providers === undefined ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProviderCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-10 w-10 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                لا يوجد حرفيون حالياً
              </h3>
              <p className="text-neutral-500 max-w-md mx-auto">
                لم نعثر على حرفيين في هذا التصنيف
                {selectedCity ? ` في ${cityLabels[selectedCity]}` : ""}. جرب
                تغيير المدينة أو تصفح تصنيفات أخرى.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((provider) => (
                <Link
                  key={provider._id}
                  href={`/providers/${provider._id}`}
                >
                  <Card hover className="group h-full">
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        {provider.avatarUrl ? (
                          <Image
                            src={provider.avatarUrl}
                            alt={provider.name}
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-full object-cover border-2 border-border"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-lg font-bold shrink-0">
                            {provider.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground truncate">
                              {provider.name}
                            </h3>
                            {provider.isPremium && (
                              <Crown className="h-4 w-4 text-accent-500 shrink-0" />
                            )}
                          </div>
                          <StarRating
                            rating={provider.avgRating}
                            size="sm"
                            className="mt-1"
                          />
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {provider.reviewCount} تقييم ·{" "}
                            {provider.serviceCount} خدمة
                          </p>
                        </div>
                      </div>

                      {provider.bio && (
                        <p className="text-sm text-neutral-600 line-clamp-2">
                          {provider.bio}
                        </p>
                      )}

                      {provider.serviceArea &&
                        provider.serviceArea.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-neutral-500">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>
                              {provider.serviceArea
                                .map((c) => cityLabels[c] ?? c)
                                .join("، ")}
                            </span>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
