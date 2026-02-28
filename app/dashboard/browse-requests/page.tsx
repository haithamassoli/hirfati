"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cityLabels } from "@/lib/constants";
import {
  Search,
  MapPin,
  Banknote,
  MessageSquareQuote,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

type City = "amman" | "irbid" | "zarqa";

export default function BrowseRequestsPage() {
  const user = useQuery(api.profile.getCurrentUser);
  const categories = useQuery(api.categories.listMain);
  const [selectedCity, setSelectedCity] = useState<City | "">("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const requests = useQuery(api.requests.listForProvider, {
    city: selectedCity || undefined,
    categoryId: selectedCategory
      ? (selectedCategory as Id<"categories">)
      : undefined,
  });

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  if (!user.isProvider) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                هذه الصفحة للحرفيين فقط
              </h2>
              <p className="text-neutral-500">
                فعّل حسابك كحرفي من صفحة الملف الشخصي لتتمكن من تصفح الطلبات.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">تصفح الطلبات</h1>
        <p className="text-neutral-500 mt-1">
          طلبات خدمة مفتوحة تتناسب مع تخصصاتك ومناطق خدمتك
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-neutral-700">
                المدينة
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value as City | "")}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
              >
                <option value="">جميع المدن</option>
                {(Object.entries(cityLabels) as [City, string][]).map(
                  ([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-neutral-700">
                التصنيف
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
              >
                <option value="">جميع التصنيفات</option>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests */}
      {requests === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                لا توجد طلبات مطابقة
              </h2>
              <p className="text-neutral-500">
                لا توجد طلبات مفتوحة تتناسب مع تخصصاتك حالياً. جرّب تغيير
                الفلاتر أو تحقق لاحقاً.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Link
              key={request._id}
              href={`/dashboard/requests/${request._id}`}
            >
              <Card hover className="mb-3">
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-foreground truncate">
                          {request.title}
                        </h3>
                        {request.hasQuoted && (
                          <Badge variant="primary">
                            <CheckCircle2 className="h-3 w-3" />
                            تم تقديم عرض
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-neutral-500 line-clamp-2 mb-2">
                        بواسطة {request.customerName}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                        <Badge variant="default">
                          {request.categoryNameAr}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {cityLabels[request.city] ?? request.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Banknote className="h-3.5 w-3.5" />
                          {request.budgetMin} - {request.budgetMax} د.أ
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquareQuote className="h-3.5 w-3.5" />
                          {request.quoteCount} عرض
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
