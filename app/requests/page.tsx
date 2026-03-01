"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequestCardSkeleton } from "@/components/ui/skeleton";
import { cityLabels } from "@/lib/constants";
import { authClient } from "@/lib/auth-client";
import {
  MapPin,
  MessageSquare,
  Clock,
  Banknote,
  FileText,
  ChevronLeft,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

type City = "amman" | "irbid" | "zarqa";

export default function RequestsPage() {
  const [selectedCity, setSelectedCity] = useState<City | undefined>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    Id<"categories"> | undefined
  >();
  const [showBudgetFilter, setShowBudgetFilter] = useState(false);
  const [budgetMin, setBudgetMin] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");

  const categories = useQuery(api.categories.listMain);
  const requests = useQuery(api.requests.listOpen, {
    city: selectedCity,
    categoryId: selectedCategoryId,
  });

  const bMin = Number(budgetMin);
  const bMax = Number(budgetMax);
  const filteredRequests = (requests ?? []).filter((r) => {
    if (bMin > 0 && r.budgetMax < bMin) return false;
    if (bMax > 0 && r.budgetMin > bMax) return false;
    return true;
  });

  const cities: { value: City | undefined; label: string }[] = [
    { value: undefined, label: "جميع المدن" },
    { value: "amman", label: "عمّان" },
    { value: "irbid", label: "إربد" },
    { value: "zarqa", label: "الزرقاء" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-bl from-primary-50 via-background to-accent-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            طلبات الخدمة المفتوحة
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            تصفح طلبات العملاء وقدّم عرض سعرك. فرصتك للحصول على عمل جديد.
          </p>
        </div>
      </section>

      {/* Filters + Requests */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="space-y-4 mb-8">
            {/* City Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
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
            </div>

            {/* Category Filter */}
            {categories && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <Filter className="h-4 w-4 text-neutral-500 shrink-0" />
                <button
                  onClick={() => setSelectedCategoryId(undefined)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    !selectedCategoryId
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  الكل
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategoryId(cat._id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      selectedCategoryId === cat._id
                        ? "bg-primary-500 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {cat.nameAr}
                  </button>
                ))}

                <button
                  onClick={() => setShowBudgetFilter(!showBudgetFilter)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer mr-auto ${
                    showBudgetFilter || budgetMin || budgetMax
                      ? "bg-primary-100 text-primary-700 border border-primary-200"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  الميزانية
                </button>
              </div>
            )}

            {/* Budget Range Filter */}
            {showBudgetFilter && (
              <div className="bg-neutral-50 rounded-xl border border-border p-5">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  نطاق الميزانية (د.أ)
                </label>
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="number"
                    min={0}
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="الحد الأدنى"
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <span className="text-neutral-400">—</span>
                  <input
                    type="number"
                    min={0}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="الحد الأعلى"
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                {(budgetMin || budgetMax) && (
                  <button
                    onClick={() => {
                      setBudgetMin("");
                      setBudgetMax("");
                    }}
                    className="mt-3 text-sm text-primary-600 hover:text-primary-700 cursor-pointer"
                  >
                    مسح
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Requests List */}
          {requests === undefined ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <RequestCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                لا توجد طلبات مفتوحة
              </h3>
              <p className="text-neutral-500 max-w-md mx-auto mb-6">
                لا توجد طلبات خدمة مفتوحة حالياً بالفلاتر المختارة. جرب تغيير
                المدينة أو التصنيف.
              </p>
              <Button
                variant="primary"
                onClick={() =>
                  authClient.signIn.social({
                    provider: "google",
                    callbackURL: "/dashboard",
                  })
                }
              >
                أنشئ طلب خدمة
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <Link key={req._id} href={`/requests/${req._id}`}>
                  <Card hover className="mb-4">
                    <CardContent>
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {/* Photos */}
                        {req.photoUrls.length > 0 && (
                          <div className="shrink-0">
                            <Image
                              src={req.photoUrls[0]}
                              alt={req.title}
                              width={120}
                              height={120}
                              className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {req.title}
                            </h3>
                            <Badge variant="primary" className="shrink-0">
                              {req.categoryNameAr}
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                            {req.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{cityLabels[req.city] ?? req.city}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Banknote className="h-3.5 w-3.5" />
                              <span>
                                {req.budgetMin} - {req.budgetMax} د.أ
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{req.quoteCount} عرض سعر</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                {new Date(
                                  req._creationTime
                                ).toLocaleDateString("ar-JO")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          <ChevronLeft className="h-5 w-5 text-neutral-400" />
                        </div>
                      </div>
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
