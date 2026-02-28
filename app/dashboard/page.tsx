"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Briefcase,
  User,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Star,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const user = useQuery(api.profile.getCurrentUser);
  const services = useQuery(api.services.listByProvider);

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  const activeServices = services?.filter((s) => s.isActive) ?? [];
  const isProfileComplete = user.isProfileComplete;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          مرحباً، {user.name}
        </h1>
        <p className="text-neutral-500 mt-1">
          إليك ملخص نشاطك على المنصة
        </p>
      </div>

      {/* Onboarding prompts */}
      {!isProfileComplete && user.isProvider && (
        <Card className="border-accent-200 bg-accent-50">
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-accent-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  أكمل ملفك الشخصي
                </h3>
                <p className="text-sm text-neutral-600 mb-3">
                  لتظهر في نتائج البحث وتبدأ في استقبال طلبات العمل، يجب عليك
                  إكمال ملفك الشخصي — أضف نبذة عنك، تخصصاتك، ومناطق خدمتك.
                </p>
                <Link href="/dashboard/profile">
                  <Button variant="accent" size="sm">
                    إكمال الملف الشخصي
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!user.isProvider && (
        <Card className="border-primary-200 bg-primary-50">
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  هل أنت حرفي؟
                </h3>
                <p className="text-sm text-neutral-600 mb-3">
                  فعّل حسابك كحرفي لعرض خدماتك والحصول على طلبات عمل من
                  العملاء.
                </p>
                <Link href="/dashboard/profile">
                  <Button variant="primary" size="sm">
                    تفعيل حساب الحرفي
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">خدماتي النشطة</p>
                <p className="text-2xl font-bold text-foreground">
                  {activeServices.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success-light flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">الملف الشخصي</p>
                <Badge variant={isProfileComplete ? "success" : "warning"}>
                  {isProfileComplete ? "مكتمل" : "غير مكتمل"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center">
                <Star className="h-6 w-6 text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">الحالة</p>
                <Badge variant={user.isProvider ? "primary" : "default"}>
                  {user.isProvider ? "حرفي" : "عميل"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/profile">
            <Card hover>
              <CardContent>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="font-medium text-foreground">
                      تعديل الملف الشخصي
                    </p>
                    <p className="text-sm text-neutral-500">
                      تحديث بياناتك ومعرض أعمالك
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-neutral-400 mr-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/services">
            <Card hover>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-primary-500" />
                  <div>
                    <p className="font-medium text-foreground">
                      إدارة الخدمات
                    </p>
                    <p className="text-sm text-neutral-500">
                      إضافة وتعديل خدماتك
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-neutral-400 mr-auto" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
