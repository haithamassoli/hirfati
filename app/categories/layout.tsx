import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تصنيفات الخدمات",
  description:
    "تصفح جميع تصنيفات الخدمات الحرفية في الأردن — سباكة، كهرباء، نجارة، حدادة، دهان، تكييف، بلاط وصيانة عامة.",
  alternates: {
    canonical: "/categories",
  },
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
