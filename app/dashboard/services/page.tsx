"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import {
  Plus,
  Edit3,
  Trash2,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { useState, useCallback, type FormEvent } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface ServiceForm {
  title: string;
  description: string;
  categoryId: string;
  priceType: "fixed" | "flexible";
  price: string;
}

const emptyForm: ServiceForm = {
  title: "",
  description: "",
  categoryId: "",
  priceType: "fixed",
  price: "",
};

export default function ServicesPage() {
  const user = useQuery(api.profile.getCurrentUser);
  const services = useQuery(api.services.listByProvider);
  const categories = useQuery(api.categories.list);
  const createService = useMutation(api.services.create);
  const updateService = useMutation(api.services.update);
  const removeService = useMutation(api.services.remove);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"services"> | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"services"> | null>(null);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback(
    (service: {
      _id: Id<"services">;
      title: string;
      description: string;
      categoryId: Id<"categories">;
      priceType: "fixed" | "flexible";
      price: number;
    }) => {
      setEditingId(service._id);
      setForm({
        title: service.title,
        description: service.description,
        categoryId: service.categoryId,
        priceType: service.priceType,
        price: String(service.price),
      });
      setModalOpen(true);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!form.categoryId || !form.price) return;

      setSaving(true);
      try {
        if (editingId) {
          await updateService({
            id: editingId,
            title: form.title,
            description: form.description,
            categoryId: form.categoryId as Id<"categories">,
            priceType: form.priceType,
            price: Number(form.price),
            isActive: true,
          });
        } else {
          await createService({
            title: form.title,
            description: form.description,
            categoryId: form.categoryId as Id<"categories">,
            priceType: form.priceType,
            price: Number(form.price),
          });
        }
        setModalOpen(false);
        setForm(emptyForm);
        setEditingId(null);
      } catch (error) {
        console.error("Failed to save service:", error);
      } finally {
        setSaving(false);
      }
    },
    [form, editingId, createService, updateService]
  );

  const handleDelete = useCallback(
    async (id: Id<"services">) => {
      try {
        await removeService({ id });
        setDeleteConfirm(null);
      } catch (error) {
        console.error("Failed to delete service:", error);
      }
    },
    [removeService]
  );

  if (user === undefined || services === undefined) {
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
                فعّل حسابك كحرفي من صفحة الملف الشخصي لتتمكن من إضافة خدمات.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">خدماتي</h1>
          <p className="text-neutral-500 mt-1">
            أضف وعدّل الخدمات التي تقدمها للعملاء
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          إضافة خدمة
        </Button>
      </div>

      {/* Services list */}
      {services.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                لا توجد خدمات بعد
              </h2>
              <p className="text-neutral-500 mb-4">
                أضف خدماتك لتظهر للعملاء في نتائج البحث
              </p>
              <Button variant="primary" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                إضافة أول خدمة
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Card key={service._id}>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {service.title}
                      </h3>
                      <Badge
                        variant={service.isActive ? "success" : "default"}
                      >
                        {service.isActive ? "نشطة" : "معطّلة"}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-500 line-clamp-2 mb-2">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant="default">{service.categoryName}</Badge>
                      <span className="font-semibold text-primary-600">
                        {service.price} د.أ
                        {service.priceType === "flexible" && "+"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(service)}
                      aria-label="تعديل الخدمة"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm(service._id)}
                      aria-label="حذف الخدمة"
                      className="text-error hover:bg-error-light"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
          setForm(emptyForm);
        }}
        title={editingId ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="service-title"
            label="عنوان الخدمة"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="مثال: تركيب وصيانة أنابيب المياه"
            required
          />

          <Textarea
            id="service-description"
            label="وصف الخدمة"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="اشرح تفاصيل الخدمة التي تقدمها..."
            rows={3}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="service-category"
              className="text-sm font-medium text-neutral-700"
            >
              التصنيف
            </label>
            <select
              id="service-category"
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value }))
              }
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">
                نوع السعر
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, priceType: "fixed" }))
                  }
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    form.priceType === "fixed"
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  ثابت
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, priceType: "flexible" }))
                  }
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    form.priceType === "flexible"
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  مرن
                </button>
              </div>
            </div>

            <Input
              id="service-price"
              label={
                form.priceType === "fixed"
                  ? "السعر (د.أ)"
                  : "السعر يبدأ من (د.أ)"
              }
              type="number"
              min="0"
              step="0.5"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              placeholder="0"
              required
              dir="ltr"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={saving}
              className="flex-1"
            >
              {editingId ? "حفظ التعديلات" : "إضافة الخدمة"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setModalOpen(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="حذف الخدمة"
      >
        <p className="text-neutral-600 mb-6">
          هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4" />
            حذف الخدمة
          </Button>
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            إلغاء
          </Button>
        </div>
      </Modal>
    </div>
  );
}
