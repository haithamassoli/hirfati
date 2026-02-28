"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Wrench, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/categories", label: "التصنيفات" },
  { href: "/requests", label: "طلبات الخدمة" },
  { href: "/about", label: "عن حرفتي" },
];

export function Navbar() {
  const { data: session } = authClient.useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">حرفتي</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-600 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => (window.location.href = "/dashboard")}
              >
                لوحة التحكم
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={() =>
                    authClient.signIn.social({
                      provider: "google",
                      callbackURL: "/dashboard",
                    })
                  }
                >
                  تسجيل الدخول
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    authClient.signIn.social({
                      provider: "google",
                      callbackURL: "/dashboard",
                    })
                  }
                >
                  ابدأ الآن
                </Button>
              </>
            )}

            <button
              className="md:hidden p-2 text-neutral-600 hover:text-foreground cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-sm text-neutral-600 hover:text-foreground hover:bg-neutral-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
