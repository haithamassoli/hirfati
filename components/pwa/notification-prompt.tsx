"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
  serializeSubscription,
  registerServiceWorker,
} from "@/lib/push";

export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasSubscription = useQuery(api.pushSubscriptions.hasSubscription);
  const saveSub = useMutation(api.pushSubscriptions.save);

  useEffect(() => {
    // Only show if: push supported, permission not yet decided, no existing subscription
    if (!isPushSupported()) return;
    if (getPushPermission() !== "default") return;
    if (hasSubscription) return;

    // Register service worker early
    registerServiceWorker();

    // Show prompt after a delay so it's not jarring
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [hasSubscription]);

  const handleAllow = async () => {
    setLoading(true);
    try {
      await registerServiceWorker();
      const subscription = await subscribeToPush();
      if (subscription) {
        const serialized = serializeSubscription(subscription);
        await saveSub({
          endpoint: serialized.endpoint,
          p256dh: serialized.keys.p256dh,
          auth: serialized.keys.auth,
        });
      }
    } catch (error) {
      console.error("Failed to subscribe:", error);
    } finally {
      setLoading(false);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    // Don't show again this session
    sessionStorage.setItem("notification-prompt-dismissed", "true");
  };

  // Don't show if already dismissed this session
  useEffect(() => {
    if (sessionStorage.getItem("notification-prompt-dismissed")) {
      setVisible(false);
    }
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm lg:bottom-6 lg:left-auto lg:right-6"
        >
          <div className="bg-surface rounded-2xl shadow-xl border border-border p-5 relative overflow-hidden">
            {/* Gradient accent bar */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-primary-500 to-accent-500" />

            <button
              onClick={handleDismiss}
              className="absolute top-3 left-3 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <Bell className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground mb-1">
                  تفعيل الإشعارات
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed mb-4">
                  احصل على إشعارات فورية عند وصول عروض أسعار جديدة، رسائل، أو
                  تحديثات على مهامك.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAllow}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "جاري التفعيل..." : "تفعيل"}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2.5 rounded-xl bg-neutral-100 text-neutral-600 text-sm font-medium hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    لاحقاً
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
