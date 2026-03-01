"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
        <WifiOff className="h-10 w-10 text-neutral-400" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-3">
        غير متصل بالإنترنت
      </h1>
      <p className="text-neutral-500 max-w-sm mb-8">
        يبدو أنك غير متصل بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
