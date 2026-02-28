"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cityLabels } from "@/lib/constants";
import {
  Plus,
  FileText,
  MessageSquareQuote,
  MapPin,
  Banknote,
} from "lucide-react";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  open: "مفتوح",
  assigned: "تم التعيين",
  closed: "مغلق",
};

const statusVariants: Record<string, "success" | "primary" | "default"> = {
  open: "success",
  assigned: "primary",
  closed: "default",
};

export default function MyRequestsPage() {
  const user = useQuery(api.profile.getCurrentUser);
  const requests = useQuery(api.requests.listByCustomer);

  if (user === undefined || requests === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">طلباتي</h1>
          <p className="text-neutral-500 mt-1">
            تابع حالة طلبات الخدمة التي نشرتها
          </p>
        </div>
        <Link href="/dashboard/requests/new">
          <Button variant="primary">
            <Plus className="h-4 w-4" />
            طلب جديد
          </Button>
        </Link>
      </div>

      {/* Requests list */}
      {requests.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                لا توجد طلبات بعد
              </h2>
              <p className="text-neutral-500 mb-4">
                انشر طلب خدمة ليتواصل معك الحرفيون المتخصصون
              </p>
              <Link href="/dashboard/requests/new">
                <Button variant="primary">
                  <Plus className="h-4 w-4" />
                  نشر أول طلب
                </Button>
              </Link>
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
                        <Badge
                          variant={statusVariants[request.status] ?? "default"}
                        >
                          {statusLabels[request.status] ?? request.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                        <Badge variant="default">{request.categoryNameAr}</Badge>
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
                          {request.quoteCount} عرض سعر
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
