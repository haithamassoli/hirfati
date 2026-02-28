import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "طلبات الخدمة المفتوحة",
  description:
    "تصفح طلبات الخدمة المفتوحة في الأردن وقدّم عرض سعرك كحرفي. فرصتك للحصول على عمل جديد في عمّان، إربد والزرقاء.",
  alternates: {
    canonical: "/requests",
  },
};

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
