"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { Spinner } from "@/components/ui/spinner";
import { cityLabels } from "@/lib/constants";
import { authClient } from "@/lib/auth-client";
import {
  MapPin,
  Crown,
  Briefcase,
  ChevronLeft,
  CheckCircle2,
  MessageSquare,
  Star,
  Send,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

export default function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const provider = useQuery(api.providers.getById, {
    id: id as Id<"users">,
  });
  const { data: session } = authClient.useSession();
  const directHire = useMutation(api.jobs.directHire);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireForm, setHireForm] = useState({
    title: "",
    description: "",
    price: "",
  });
  const [hireLoading, setHireLoading] = useState(false);

  async function handleDirectHire() {
    if (!hireForm.title || !hireForm.description || !hireForm.price) return;
    setHireLoading(true);
    try {
      const jobId = await directHire({
        providerId: id as Id<"users">,
        title: hireForm.title,
        description: hireForm.description,
        price: Number(hireForm.price),
      });
      setShowHireModal(false);
      router.push(`/dashboard/jobs/${jobId}`);
    } catch (err: any) {
      alert(err.message || "حدث خطأ");
    } finally {
      setHireLoading(false);
    }
  }

  function handleHireClick() {
    if (!session) {
      authClient.signIn.social({
        provider: "google",
        callbackURL: `/providers/${id}`,
      });
      return;
    }
    setShowHireModal(true);
  }

  if (provider === undefined) {
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

  if (provider === null) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            الحرفي غير موجود
          </h1>
          <p className="text-neutral-500 mb-6">
            عذراً، لم نتمكن من العثور على هذا الحرفي.
          </p>
          <Link href="/categories">
            <Button variant="primary">تصفح التصنيفات</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

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
              href="/categories"
              className="hover:text-foreground transition-colors"
            >
              التصنيفات
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground">{provider.name}</span>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <section className="bg-gradient-to-bl from-primary-50 via-background to-accent-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {provider.avatarUrl ? (
                <Image
                  src={provider.avatarUrl}
                  alt={provider.name}
                  width={120}
                  height={120}
                  className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 text-4xl font-bold border-4 border-white shadow-md">
                  {provider.name.charAt(0)}
                </div>
              )}
              {provider.isPremium && (
                <div className="absolute -top-2 -left-2 bg-accent-500 rounded-full p-1.5">
                  <Crown className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {provider.name}
                </h1>
                {provider.isPremium && (
                  <Badge variant="premium">
                    <Crown className="h-3 w-3" />
                    حرفي مميز
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <StarRating rating={provider.avgRating} size="md" />
                <span className="text-sm text-neutral-500">
                  ({provider.reviewCount} تقييم)
                </span>

                {provider.serviceArea && provider.serviceArea.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-neutral-500">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {provider.serviceArea
                        .map((c) => cityLabels[c as string] ?? c)
                        .join("، ")}
                    </span>
                  </div>
                )}
              </div>

              {provider.bio && (
                <p className="text-neutral-600 leading-relaxed max-w-2xl mb-4">
                  {provider.bio}
                </p>
              )}

              {/* Trade Categories */}
              {provider.tradeCategories &&
                provider.tradeCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {provider.tradeCategories
                      .filter(Boolean)
                      .map(
                        (cat) => (
                          <Link key={cat!._id} href={`/categories/${cat!.slug}`}>
                            <Badge variant="primary" className="cursor-pointer">
                              {cat!.nameAr}
                            </Badge>
                          </Link>
                        )
                      )}
                  </div>
                )}

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-neutral-600">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>{provider.completedJobs} مهمة مكتملة</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-600">
                  <Briefcase className="h-4 w-4 text-primary-500" />
                  <span>{provider.services.length} خدمة متاحة</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0">
              <Button
                variant="primary"
                size="lg"
                onClick={handleHireClick}
              >
                <Send className="h-5 w-5" />
                طلب خدمة مباشرة
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Services */}
              {provider.services.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    الخدمات المتاحة
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {provider.services.map(
                      (service: {
                        _id: string;
                        title: string;
                        description: string;
                        priceType: string;
                        price: number;
                        categoryName: string;
                      }) => (
                        <Card key={service._id}>
                          <CardContent>
                            <h3 className="font-semibold text-foreground mb-1">
                              {service.title}
                            </h3>
                            <p className="text-sm text-neutral-500 line-clamp-2 mb-3">
                              {service.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="default">
                                {service.categoryName}
                              </Badge>
                              <span className="font-semibold text-primary-600">
                                {service.price} د.أ
                                {service.priceType === "flexible" && "+"}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {provider.portfolio && provider.portfolio.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    معرض الأعمال
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {provider.portfolio.map(
                      (
                        item: {
                          url: string | null;
                          caption?: string;
                          imageStorageId: string;
                        },
                        i: number
                      ) =>
                        item.url && (
                          <button
                            key={item.imageStorageId}
                            onClick={() => setSelectedImage(item.url)}
                            className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                          >
                            <Image
                              src={item.url}
                              alt={item.caption ?? `عمل ${i + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {item.caption && (
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                <p className="text-white text-xs">
                                  {item.caption}
                                </p>
                              </div>
                            )}
                          </button>
                        )
                    )}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  التقييمات ({provider.reviewCount})
                </h2>
                {provider.reviews.length === 0 ? (
                  <div className="text-center py-8 bg-neutral-50 rounded-xl">
                    <Star className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
                    <p className="text-neutral-500">لا توجد تقييمات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {provider.reviews.map(
                      (review: {
                        _id: string;
                        rating: number;
                        comment: string;
                        reviewerName: string;
                        reviewerAvatar?: string;
                        _creationTime: number;
                      }) => (
                        <Card key={review._id}>
                          <CardContent>
                            <div className="flex items-start gap-3">
                              {review.reviewerAvatar ? (
                                <Image
                                  src={review.reviewerAvatar}
                                  alt={review.reviewerName}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 text-sm font-bold shrink-0">
                                  {review.reviewerName.charAt(0)}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-foreground">
                                    {review.reviewerName}
                                  </span>
                                  <span className="text-xs text-neutral-400">
                                    {new Date(
                                      review._creationTime
                                    ).toLocaleDateString("ar-JO")}
                                  </span>
                                </div>
                                <StarRating
                                  rating={review.rating}
                                  size="sm"
                                  showValue={false}
                                />
                                <p className="text-sm text-neutral-600 mt-2">
                                  {review.comment}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent>
                  <h3 className="font-semibold text-foreground mb-4">
                    معلومات سريعة
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">التقييم</dt>
                      <dd className="font-medium text-foreground">
                        {provider.avgRating > 0
                          ? `${provider.avgRating}/5`
                          : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">المهام المكتملة</dt>
                      <dd className="font-medium text-foreground">
                        {provider.completedJobs}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">عدد التقييمات</dt>
                      <dd className="font-medium text-foreground">
                        {provider.reviewCount}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">الخدمات</dt>
                      <dd className="font-medium text-foreground">
                        {provider.services.length}
                      </dd>
                    </div>
                    {provider.serviceArea &&
                      provider.serviceArea.length > 0 && (
                        <div className="flex justify-between">
                          <dt className="text-neutral-500">المدن</dt>
                          <dd className="font-medium text-foreground">
                            {provider.serviceArea
                              .map((c) => cityLabels[c as string] ?? c)
                              .join("، ")}
                          </dd>
                        </div>
                      )}
                  </dl>
                </CardContent>
              </Card>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleHireClick}
              >
                <Send className="h-5 w-5" />
                طلب خدمة من هذا الحرفي
              </Button>
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

      {/* Direct Hire Modal */}
      <Modal
        isOpen={showHireModal}
        onClose={() => setShowHireModal(false)}
        title={`طلب خدمة من ${provider.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              عنوان الخدمة المطلوبة
            </label>
            <Input
              placeholder="مثال: تصليح أنابيب المطبخ"
              value={hireForm.title}
              onChange={(e) =>
                setHireForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              وصف تفصيلي
            </label>
            <Textarea
              placeholder="صف المشكلة أو الخدمة التي تحتاجها بالتفصيل..."
              rows={4}
              value={hireForm.description}
              onChange={(e) =>
                setHireForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              الميزانية المقترحة (د.أ)
            </label>
            <Input
              type="number"
              placeholder="50"
              min={1}
              value={hireForm.price}
              onChange={(e) =>
                setHireForm((f) => ({ ...f, price: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowHireModal(false)}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              disabled={
                hireLoading ||
                !hireForm.title ||
                !hireForm.description ||
                !hireForm.price
              }
              onClick={handleDirectHire}
            >
              {hireLoading ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
              إرسال الطلب
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
