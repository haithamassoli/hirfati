"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { cityLabels } from "@/lib/constants";
import {
  Camera,
  Save,
  Plus,
  Trash2,
  ImageIcon,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { compressImage } from "@/lib/image-compress";

type City = "amman" | "irbid" | "zarqa";

export default function ProfileEditPage() {
  const user = useQuery(api.profile.getCurrentUser);
  const categories = useQuery(api.categories.listMain);
  const updateProfile = useMutation(api.profile.updateProfile);
  const updateAvatar = useMutation(api.profile.updateAvatar);
  const addPortfolioImage = useMutation(api.profile.addPortfolioImage);
  const deletePortfolioImage = useMutation(api.profile.deletePortfolioImage);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [isProvider, setIsProvider] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Id<"categories">[]>([]);
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [caption, setCaption] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio ?? "");
      setPhone(user.phone ?? "");
      setIsProvider(user.isProvider);
      setSelectedCategories(user.tradeCategories ?? []);
      setSelectedCities((user.serviceArea as City[]) ?? []);
    }
  }, [user]);

  const handleSave = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({
        name,
        bio: bio || undefined,
        phone: phone || undefined,
        isProvider,
        tradeCategories: isProvider ? selectedCategories : undefined,
        serviceArea: isProvider ? selectedCities : undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
    }
  }, [name, bio, phone, isProvider, selectedCategories, selectedCities, updateProfile]);

  const handleAvatarUpload = useCallback(async (file: File) => {
    setUploadingAvatar(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
      });
      const url = await generateUploadUrl();
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "image/webp" },
        body: compressed,
      });
      const { storageId } = await result.json();
      await updateAvatar({ storageId });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
    } finally {
      setUploadingAvatar(false);
    }
  }, [generateUploadUrl, updateAvatar]);

  const handlePortfolioUpload = useCallback(async (file: File) => {
    setUploadingPortfolio(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
      });
      const url = await generateUploadUrl();
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "image/webp" },
        body: compressed,
      });
      const { storageId } = await result.json();
      await addPortfolioImage({ storageId, caption: caption || undefined });
      setCaption("");
    } catch (error) {
      console.error("Failed to upload portfolio image:", error);
    } finally {
      setUploadingPortfolio(false);
    }
  }, [generateUploadUrl, addPortfolioImage, caption]);

  const toggleCategory = useCallback((catId: Id<"categories">) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  }, []);

  const toggleCity = useCallback((city: City) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  }, []);

  if (user === undefined || categories === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            الملف الشخصي
          </h1>
          <p className="text-neutral-500 mt-1">
            عدّل بياناتك الشخصية ومعلومات حسابك
          </p>
        </div>
        {user.isProfileComplete && (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3" />
            مكتمل
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar section */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              الصورة الشخصية
            </h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  src={user.avatarUrl}
                  alt={user.name}
                  size="xl"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Spinner size="sm" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  اضغط على أيقونة الكاميرا لتغيير الصورة
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  JPG, PNG أو WebP — حد أقصى 5 ميجابايت
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic info */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              المعلومات الأساسية
            </h2>
            <div className="space-y-4">
              <Input
                id="name"
                label="الاسم الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="أدخل اسمك"
              />
              <Input
                id="phone"
                label="رقم الهاتف (اختياري)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07xxxxxxxx"
                type="tel"
                dir="ltr"
              />
              <div>
                <Textarea
                  id="bio"
                  label="نبذة عنك"
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 500))}
                  placeholder="اكتب نبذة مختصرة عن خبراتك ومهاراتك..."
                  rows={4}
                />
                <p className="text-xs text-neutral-400 mt-1 text-left" dir="ltr">
                  {bio.length}/500
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider toggle */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              نوع الحساب
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsProvider(false)}
                className={`flex-1 p-4 rounded-xl border-2 transition-colors cursor-pointer text-center ${
                  !isProvider
                    ? "border-primary-500 bg-primary-50"
                    : "border-border hover:border-border-hover"
                }`}
              >
                <p className="font-semibold text-foreground">عميل</p>
                <p className="text-xs text-neutral-500 mt-1">
                  أبحث عن حرفيين لتنفيذ أعمال
                </p>
              </button>
              <button
                type="button"
                onClick={() => setIsProvider(true)}
                className={`flex-1 p-4 rounded-xl border-2 transition-colors cursor-pointer text-center ${
                  isProvider
                    ? "border-primary-500 bg-primary-50"
                    : "border-border hover:border-border-hover"
                }`}
              >
                <p className="font-semibold text-foreground">حرفي</p>
                <p className="text-xs text-neutral-500 mt-1">
                  أقدم خدمات حرفية للعملاء
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Provider-specific fields */}
        {isProvider && (
          <>
            {/* Trade categories */}
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  تخصصاتك
                </h2>
                <p className="text-sm text-neutral-500 mb-4">
                  اختر التصنيفات التي تقدم فيها خدماتك
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories?.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => toggleCategory(cat._id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        selectedCategories.includes(cat._id)
                          ? "bg-primary-500 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {cat.nameAr}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service area */}
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  مناطق الخدمة
                </h2>
                <p className="text-sm text-neutral-500 mb-4">
                  اختر المدن التي تقدم فيها خدماتك
                </p>
                <div className="flex flex-wrap gap-3">
                  {(
                    Object.entries(cityLabels) as [City, string][]
                  ).map(([city, label]) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => toggleCity(city)}
                      className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                        selectedCities.includes(city)
                          ? "bg-primary-500 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Save button */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={saving}
            disabled={saving || !name.trim()}
          >
            <Save className="h-5 w-5" />
            حفظ التغييرات
          </Button>
          {saved && (
            <span className="text-sm text-success flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              تم الحفظ بنجاح
            </span>
          )}
        </div>
      </form>

      {/* Portfolio section (only for providers) */}
      {isProvider && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  معرض الأعمال
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                  أضف صوراً لأعمالك السابقة لجذب المزيد من العملاء
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => portfolioInputRef.current?.click()}
                disabled={uploadingPortfolio}
                isLoading={uploadingPortfolio}
              >
                <Plus className="h-4 w-4" />
                إضافة صورة
              </Button>
              <input
                ref={portfolioInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePortfolioUpload(file);
                }}
              />
            </div>

            {/* Caption input for next upload */}
            <div className="mb-4">
              <Input
                id="caption"
                label="وصف الصورة التالية (اختياري)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="مثال: تركيب بلاط في عمّان"
              />
            </div>

            {/* Portfolio grid */}
            {user.portfolio && user.portfolio.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {user.portfolio.map((item) =>
                  item.url ? (
                    <div
                      key={item.imageStorageId}
                      className="relative group rounded-xl overflow-hidden aspect-square"
                    >
                      <Image
                        src={item.url}
                        alt={item.caption ?? "صورة من معرض الأعمال"}
                        fill
                        className="object-cover"
                      />
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() =>
                            deletePortfolioImage({
                              imageStorageId: item.imageStorageId,
                            })
                          }
                          className="p-2 rounded-full bg-error text-white hover:bg-red-600 transition-colors cursor-pointer"
                          aria-label="حذف الصورة"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {/* Caption */}
                      {item.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <p className="text-white text-xs">{item.caption}</p>
                        </div>
                      )}
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                <ImageIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 font-medium">
                  لا توجد صور في معرض الأعمال
                </p>
                <p className="text-sm text-neutral-400 mt-1">
                  أضف صوراً لأعمالك السابقة لبناء الثقة مع العملاء
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
