"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Spinner } from "@/components/ui/spinner";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import * as m from "motion/react-client";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const colorMap: Record<string, string> = {
  plumbing: "bg-blue-50 text-blue-600 border-blue-100",
  electrical: "bg-amber-50 text-amber-600 border-amber-100",
  carpentry: "bg-orange-50 text-orange-600 border-orange-100",
  blacksmithing: "bg-neutral-100 text-neutral-700 border-neutral-200",
  painting: "bg-pink-50 text-pink-600 border-pink-100",
  hvac: "bg-cyan-50 text-cyan-600 border-cyan-100",
  "tiling-flooring": "bg-emerald-50 text-emerald-600 border-emerald-100",
  "general-maintenance": "bg-violet-50 text-violet-600 border-violet-100",
};

export default function CategoriesPage() {
  const allCategories = useQuery(api.categories.list);

  if (!allCategories) {
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

  const mainCategories = allCategories.filter((c) => !c.parentId);
  const getSubcategories = (parentId: string) =>
    allCategories.filter((c) => c.parentId === parentId);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-bl from-primary-50 via-background to-accent-50 py-16">
        <m.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
            تصنيفات الخدمات
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            تصفح جميع تصنيفات الخدمات المتاحة واعثر على الحرفي المناسب لاحتياجك
          </p>
        </m.div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {mainCategories.map((cat) => {
              const subs = getSubcategories(cat._id);
              const color =
                colorMap[cat.slug] ?? "bg-neutral-100 text-neutral-600";

              return (
                <m.div key={cat._id} variants={fadeInUp}>
                  <Card className="group overflow-hidden">
                    <CardContent className="p-0">
                      <Link
                        href={`/categories/${cat.slug}`}
                        className="flex items-center gap-4 p-6 hover:bg-neutral-50 transition-colors"
                      >
                        <div
                          className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
                        >
                          <CategoryIcon icon={cat.icon} className="h-8 w-8" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold text-foreground mb-1">
                            {cat.nameAr}
                          </h2>
                          <p className="text-sm text-neutral-500">{cat.name}</p>
                        </div>
                        <ChevronLeft className="h-5 w-5 text-neutral-400 group-hover:text-primary-500 transition-colors shrink-0" />
                      </Link>

                      {/* Subcategories */}
                      {subs.length > 0 && (
                        <div className="border-t border-border px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {subs.map((sub) => (
                              <Link
                                key={sub._id}
                                href={`/categories/${sub.slug}`}
                                className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                              >
                                {sub.nameAr}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </m.div>
              );
            })}
          </m.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
