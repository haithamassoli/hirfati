"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cityLabels } from "@/lib/constants";
import { authClient } from "@/lib/auth-client";
import {
  MapPin,
  MessageSquare,
  Clock,
  Banknote,
  ChevronLeft,
  User,
  Send,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { use, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const request = useQuery(api.requests.getById, {
    id: id as Id<"requests">,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (request === undefined) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Spinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (request === null) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            الطلب غير موجود
          </h1>
          <p className="text-neutral-500 mb-6">
            عذراً، لم نتمكن من العثور على هذا الطلب.
          </p>
          <Link href="/requests">
            <Button variant="primary">تصفح الطلبات</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    open: "مفتوح",
    assigned: "تم التعيين",
    closed: "مغلق",
  };

  const statusVariants: Record<string, "success" | "warning" | "default"> = {
    open: "success",
    assigned: "warning",
    closed: "default",
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/" className="hover:text-foreground transition-colors">
              الرئيسية
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <Link
              href="/requests"
              className="hover:text-foreground transition-colors"
            >
              طلبات الخدمة
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground line-clamp-1">{request.title}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {request.title}
                  </h1>
                  <Badge variant={statusVariants[request.status]}>
                    {statusLabels[request.status]}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 mb-6">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{request.customerName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{cityLabels[request.city] ?? request.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(request._creationTime).toLocaleDateString(
                        "ar-JO",
                        { year: "numeric", month: "long", day: "numeric" }
                      )}
                    </span>
                  </div>
                  <Link
                    href={`/categories/${request.categorySlug}`}
                    className="flex items-center gap-1 hover:text-primary-500 transition-colors"
                  >
                    <Badge variant="primary">{request.categoryNameAr}</Badge>
                  </Link>
                </div>
              </div>

              {/* Description */}
              <Card>
                <CardContent>
                  <h2 className="font-semibold text-foreground mb-3">
                    وصف الطلب
                  </h2>
                  <p className="text-neutral-600 leading-relaxed whitespace-pre-line">
                    {request.description}
                  </p>
                </CardContent>
              </Card>

              {/* Photos */}
              {request.photoUrls.length > 0 && (
                <Card>
                  <CardContent>
                    <h2 className="font-semibold text-foreground mb-3">
                      صور الطلب
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {request.photoUrls.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImage(url)}
                          className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                        >
                          <Image
                            src={url}
                            alt={`صورة ${i + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Budget Card */}
              <Card>
                <CardContent>
                  <h3 className="font-semibold text-foreground mb-4">
                    تفاصيل الطلب
                  </h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-xs text-neutral-500 mb-1">
                        الميزانية
                      </dt>
                      <dd className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-primary-500" />
                        <span className="text-lg font-bold text-foreground">
                          {request.budgetMin} - {request.budgetMax} د.أ
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-neutral-500 mb-1">
                        عروض الأسعار
                      </dt>
                      <dd className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary-500" />
                        <span className="text-lg font-bold text-foreground">
                          {request.quoteCount}
                        </span>
                        <span className="text-sm text-neutral-500">
                          من أصل {request.totalQuotes}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-neutral-500 mb-1">
                        التصنيف
                      </dt>
                      <dd>
                        <Badge variant="primary">
                          {request.categoryNameAr}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-neutral-500 mb-1">المدينة</dt>
                      <dd className="flex items-center gap-1 text-foreground">
                        <MapPin className="h-4 w-4 text-neutral-400" />
                        {cityLabels[request.city] ?? request.city}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {request.status === "open" && (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() =>
                    authClient.signIn.social({
                      provider: "google",
                      callbackURL: "/dashboard",
                    })
                  }
                >
                  <Send className="h-5 w-5" />
                  قدّم عرض سعر
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 left-4 text-white text-2xl cursor-pointer hover:opacity-75"
            aria-label="إغلاق"
          >
            &times;
          </button>
          <Image
            src={selectedImage}
            alt="صورة مكبرة"
            width={900}
            height={600}
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
          />
        </div>
      )}

      <Footer />
    </div>
  );
}
