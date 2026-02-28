"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wrench,
  LayoutDashboard,
  User,
  Briefcase,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  FileText,
  Search,
  ClipboardList,
} from "lucide-react";
import { useState, type ReactNode } from "react";

const sidebarLinks = [
  {
    href: "/dashboard",
    label: "الرئيسية",
    icon: LayoutDashboard,
    roles: ["customer", "provider"] as const,
  },
  {
    href: "/dashboard/profile",
    label: "الملف الشخصي",
    icon: User,
    roles: ["customer", "provider"] as const,
  },
  {
    href: "/dashboard/services",
    label: "خدماتي",
    icon: Briefcase,
    roles: ["provider"] as const,
  },
  {
    href: "/dashboard/requests",
    label: "طلباتي",
    icon: FileText,
    roles: ["customer"] as const,
  },
  {
    href: "/dashboard/browse-requests",
    label: "تصفح الطلبات",
    icon: Search,
    roles: ["provider"] as const,
  },
  {
    href: "/dashboard/jobs",
    label: "المهام",
    icon: ClipboardList,
    roles: ["customer", "provider"] as const,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = useQuery(api.profile.getCurrentUser);
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-surface border-l border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">حرفتي</span>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            onClick={() => setSidebarOpen(false)}
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar
                src={user.avatarUrl}
                alt={user.name}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.name}
                </p>
                <Badge
                  variant={user.isProvider ? "primary" : "default"}
                  className="mt-0.5"
                >
                  {user.isProvider ? "حرفي" : "عميل"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarLinks
            .filter((link) => {
              const role = user?.isProvider ? "provider" : "customer";
              return (link.roles as readonly string[]).includes(role);
            })
            .map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-foreground"
                )}
              >
                <link.icon className="h-5 w-5 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-neutral-600 hover:bg-neutral-100 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5 shrink-0 rotate-180" />
            <span>العودة للموقع</span>
          </Link>
          <button
            onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } })}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-error hover:bg-error-light transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            onClick={() => setSidebarOpen(true)}
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500 hidden sm:block">
                  مرحباً، {user.name}
                </span>
                <Avatar
                  src={user.avatarUrl}
                  alt={user.name}
                  size="sm"
                />
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
