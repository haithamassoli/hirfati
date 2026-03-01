"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { cityLabels } from "@/lib/constants";
import { ArrowRight, Camera, ImageIcon, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, type FormEvent } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { compressImage } from "@/lib/image-compress";

type City = "amman" | "irbid" | "zarqa";

export default function NewRequestPage() {
  const router = useRouter();
  const categories = useQuery(api.categories.listMain);
  const createRequest = useMutation(api.requests.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [city, setCity] = useState<City | "">("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [photos, setPhotos] = useState<{ storageId: Id<"_storage">; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = useCallback(
    async (files: FileList) => {
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          const compressed = await compressImage(file, {
            maxWidth: 1000,
            maxHeight: 1000,
            quality: 0.8,
          });
          const url = await generateUploadUrl();
          const result = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "image/webp" },
            body: compressed,
          });
          const { storageId } = await result.json();
          const previewUrl = URL.createObjectURL(compressed);
          setPhotos((prev) => [...prev, { storageId, url: previewUrl }]);
        }
      } catch (error) {
        console.error("Failed to upload photo:", error);
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl]
  );

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!categoryId || !city || !budgetMin || !budgetMax) return;

      setSaving(true);
      try {
        await createRequest({
          title,
          description,
          categoryId: categoryId as Id<"categories">,
          city: city as City,
          budgetMin: Number(budgetMin),
          budgetMax: Number(budgetMax),
          photos: photos.length > 0 ? photos.map((p) => p.storageId) : undefined,
        });
        router.push("/dashboard/requests");
      } catch (error) {
        console.error("Failed to create request:", error);
      } finally {
        setSaving(false);
      }
    },
    [title, description, categoryId, city, budgetMin, budgetMax, photos, createRequest, router]
  );

  if (categories === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/requests"
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">طلب خدمة جديد</h1>
          <p className="text-neutral-500 mt-1">
            صف ما تحتاجه وسيتواصل معك الحرفيون المتخصصون
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              تفاصيل الطلب
            </h2>
            <div className="space-y-4">
              <Input
                id="title"
                label="عنوان الطلب"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: إصلاح تسريب مياه في المطبخ"
                required
              />

              <Textarea
                id="description"
                label="وصف تفصيلي"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                placeholder="اشرح المشكلة أو العمل المطلوب بالتفصيل..."
                rows={5}
                required
              />
              <p className="text-xs text-neutral-400 mt-1 text-left" dir="ltr">
                {description.length}/1000
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Category & City */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              التصنيف والموقع
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="category"
                  className="text-sm font-medium text-neutral-700"
                >
                  التصنيف
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
                >
                  <option value="">اختر التصنيف</option>
                  {categories?.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="city"
                  className="text-sm font-medium text-neutral-700"
                >
                  المدينة
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value as City)}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
                >
                  <option value="">اختر المدينة</option>
                  {(Object.entries(cityLabels) as [City, string][]).map(
                    ([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              الميزانية
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              حدد نطاق الميزانية المتوقعة بالدينار الأردني
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="budgetMin"
                label="الحد الأدنى (د.أ)"
                type="number"
                min="0"
                step="1"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="0"
                required
                dir="ltr"
              />
              <Input
                id="budgetMax"
                label="الحد الأقصى (د.أ)"
                type="number"
                min="0"
                step="1"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="0"
                required
                dir="ltr"
              />
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  صور (اختياري)
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                  أضف صوراً توضيحية للعمل المطلوب
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                isLoading={uploading}
              >
                <Camera className="h-4 w-4" />
                إضافة صور
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handlePhotoUpload(e.target.files);
                  }
                }}
              />
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative group rounded-xl overflow-hidden aspect-square"
                  >
                    <Image
                      src={photo.url}
                      alt={`صورة ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-error text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      aria-label="حذف الصورة"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                <ImageIcon className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">
                  اضغط &quot;إضافة صور&quot; لإرفاق صور توضيحية
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={saving}
            disabled={saving || !title.trim() || !description.trim() || !categoryId || !city || !budgetMin || !budgetMax}
          >
            <Plus className="h-5 w-5" />
            نشر الطلب
          </Button>
          <Link href="/dashboard/requests">
            <Button type="button" variant="ghost" size="lg">
              إلغاء
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
