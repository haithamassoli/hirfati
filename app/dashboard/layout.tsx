"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
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
  Star,
  ArrowLeftRight,
  Crown,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { NotificationPrompt } from "@/components/pwa/notification-prompt";
import type { FunctionReturnType } from "convex/server";

type Role = "customer" | "provider";
type CurrentUser = NonNullable<FunctionReturnType<typeof api.profile.getCurrentUser>>;

interface SidebarLink {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: readonly Role[];
  section?: "main" | "provider" | "customer";
}

const sidebarLinks: SidebarLink[] = [
  {
    href: "/dashboard",
    label: "الرئيسية",
    icon: LayoutDashboard,
    roles: ["customer", "provider"],
    section: "main",
  },
  {
    href: "/dashboard/profile",
    label: "الملف الشخصي",
    icon: User,
    roles: ["customer", "provider"],
    section: "main",
  },
  {
    href: "/dashboard/services",
    label: "خدماتي",
    icon: Briefcase,
    roles: ["provider"],
    section: "provider",
  },
  {
    href: "/dashboard/browse-requests",
    label: "تصفح الطلبات",
    icon: Search,
    roles: ["provider"],
    section: "provider",
  },
  {
    href: "/dashboard/requests",
    label: "طلباتي",
    icon: FileText,
    roles: ["customer"],
    section: "customer",
  },
  {
    href: "/dashboard/jobs",
    label: "مهامي",
    icon: ClipboardList,
    roles: ["customer", "provider"],
    section: "main",
  },
  {
    href: "/dashboard/reviews",
    label: "التقييمات",
    icon: Star,
    roles: ["customer", "provider"],
    section: "main",
  },
  {
    href: "/dashboard/premium",
    label: "الباقات المميزة",
    icon: Crown,
    roles: ["provider"],
    section: "provider",
  },
];

// Bottom nav links (subset for mobile)
const bottomNavLinks: SidebarLink[] = [
  {
    href: "/dashboard",
    label: "الرئيسية",
    icon: LayoutDashboard,
    roles: ["customer", "provider"],
  },
  {
    href: "/dashboard/jobs",
    label: "مهامي",
    icon: ClipboardList,
    roles: ["customer", "provider"],
  },
  {
    href: "/dashboard/browse-requests",
    label: "الطلبات",
    icon: Search,
    roles: ["provider"],
  },
  {
    href: "/dashboard/requests",
    label: "طلباتي",
    icon: FileText,
    roles: ["customer"],
  },
  {
    href: "/dashboard/profile",
    label: "حسابي",
    icon: User,
    roles: ["customer", "provider"],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = useQuery(api.profile.getCurrentUser);
  const toggleRole = useMutation(api.profile.toggleRole);
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTogglingRole, setIsTogglingRole] = useState(false);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  const role: Role = user?.isProvider ? "provider" : "customer";

  const filteredLinks = sidebarLinks.filter((link) =>
    (link.roles as readonly string[]).includes(role)
  );

  const filteredBottomLinks = bottomNavLinks.filter((link) =>
    (link.roles as readonly string[]).includes(role)
  );

  // Group sidebar links by section
  const mainLinks = filteredLinks.filter(
    (l) => l.section === "main" || !l.section
  );
  const roleLinks = filteredLinks.filter(
    (l) => l.section === "provider" || l.section === "customer"
  );

  const handleToggleRole = async () => {
    if (isTogglingRole) return;
    setIsTogglingRole(true);
    try {
      await toggleRole();
    } finally {
      setIsTogglingRole(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar overlay on mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar (desktop: static, mobile: animated slide) */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-surface border-l border-border flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto hidden lg:flex"
        )}
      >
        <SidebarContent
          user={user}
          mainLinks={mainLinks}
          roleLinks={roleLinks}
          role={role}
          pathname={pathname}
          isTogglingRole={isTogglingRole}
          onToggleRole={handleToggleRole}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Mobile sidebar with animation */}
      <AnimatePresence>
        {sidebarOpen && (
          <m.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-72 bg-surface border-l border-border flex flex-col lg:hidden"
          >
            <SidebarContent
              user={user}
              mainLinks={mainLinks}
              roleLinks={roleLinks}
              role={role}
              pathname={pathname}
              isTogglingRole={isTogglingRole}
              onToggleRole={handleToggleRole}
              onClose={() => setSidebarOpen(false)}
              showClose
            />
          </m.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-8">
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
                  مرحبا، {user.name}
                </span>
                <Avatar src={user.avatarUrl} alt={user.name} size="sm" />
              </div>
            )}
          </div>
        </header>

        {/* Page content — extra padding-bottom on mobile for bottom nav */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">{children}</main>
      </div>

      {/* Notification permission prompt */}
      <NotificationPrompt />

      {/* Bottom navigation (mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {filteredBottomLinks.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] transition-colors",
                  isActive
                    ? "text-primary-600"
                    : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                <link.icon
                  className={cn(
                    "h-5 w-5",
                    isActive && "text-primary-600"
                  )}
                />
                <span className="text-[10px] font-medium leading-tight">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}

// Extracted sidebar content to avoid duplication
function SidebarContent({
  user,
  mainLinks,
  roleLinks,
  role,
  pathname,
  isTogglingRole,
  onToggleRole,
  onClose,
  showClose,
}: {
  user: CurrentUser | null;
  mainLinks: SidebarLink[];
  roleLinks: SidebarLink[];
  role: Role;
  pathname: string;
  isTogglingRole: boolean;
  onToggleRole: () => void;
  onClose: () => void;
  showClose?: boolean;
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">حرفتي</span>
        </Link>
        {showClose && (
          <button
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User info + role toggle */}
      {user && (
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatarUrl} alt={user.name} size="md" />
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
          {/* Role toggle */}
          <button
            onClick={onToggleRole}
            disabled={isTogglingRole}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {isTogglingRole
              ? "جاري التبديل..."
              : `التبديل إلى وضع ${user.isProvider ? "العميل" : "الحرفي"}`}
          </button>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* Main section */}
        <div className="space-y-1">
          {mainLinks.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
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
        </div>

        {/* Role-specific section */}
        {roleLinks.length > 0 && (
          <>
            <div className="mt-5 mb-2 px-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                {role === "provider" ? "أدوات الحرفي" : "أدوات العميل"}
              </span>
            </div>
            <div className="space-y-1">
              {roleLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
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
            </div>
          </>
        )}
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
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/";
                },
              },
            })
          }
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-error hover:bg-error-light transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </>
  );
}
