"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type IOSNavigator = Navigator & { standalone?: boolean };

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as IOSNavigator).standalone === true
  );
}

function isIOSDevice() {
  if (typeof window === "undefined") return false;
  const hasMSStream = "MSStream" in window;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !hasMSStream;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS] = useState(() => isIOSDevice());
  const [isStandalone] = useState(() => isStandaloneMode());

  useEffect(() => {
    if (isStandalone) return;

    // Check if already dismissed
    const dismissed = localStorage.getItem("install-prompt-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    let showTimer: ReturnType<typeof setTimeout> | null = null;

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay
      showTimer = setTimeout(() => setVisible(true), 5000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // On iOS, show manual install instructions after delay
    if (isIOS) {
      showTimer = setTimeout(() => setVisible(true), 5000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (showTimer) clearTimeout(showTimer);
    };
  }, [isIOS, isStandalone]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
  };

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm lg:bottom-6 lg:left-auto lg:right-6"
        >
          <div className="bg-surface rounded-2xl shadow-xl border border-border overflow-hidden">
            {/* Gradient header */}
            <div className="bg-gradient-to-l from-primary-600 to-primary-500 px-5 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">تثبيت تطبيق حرفتي</h3>
                    <p className="text-xs text-white/80">
                      وصول أسرع وإشعارات فورية
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-5 py-4">
              {isIOS ? (
                // iOS manual install instructions
                <div className="space-y-3">
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    لتثبيت التطبيق على جهازك:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-[10px]">
                        1
                      </span>
                      <span className="text-neutral-700">
                        اضغط على زر المشاركة{" "}
                        <span className="inline-block w-4 h-4 align-middle">
                          ⬆
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-[10px]">
                        2
                      </span>
                      <span className="text-neutral-700">
                        اختر &quot;إضافة إلى الشاشة الرئيسية&quot;
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-[10px]">
                        3
                      </span>
                      <span className="text-neutral-700">
                        اضغط &quot;إضافة&quot;
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="w-full mt-2 px-4 py-2.5 rounded-xl bg-neutral-100 text-neutral-600 text-sm font-medium hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    فهمت
                  </button>
                </div>
              ) : (
                // Android/Chrome install button
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      ثبّت التطبيق للحصول على تجربة أفضل مع إشعارات فورية
                      ووصول سريع من شاشتك الرئيسية.
                    </p>
                  </div>
                </div>
              )}

              {!isIOS && deferredPrompt && (
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={handleInstall}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    تثبيت الآن
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2.5 rounded-xl bg-neutral-100 text-neutral-600 text-sm font-medium hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    لاحقاً
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
