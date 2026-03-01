"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { StarRating } from "@/components/ui/star-rating";
import { cityLabels } from "@/lib/constants";
import { MapPin, Crown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Id } from "@/convex/_generated/dataModel";

interface PremiumBannerProps {
  categoryId?: Id<"categories">;
  limit?: number;
  title?: string;
}

export function PremiumBanner({
  categoryId,
  limit = 4,
  title = "حرفيون مميزون",
}: PremiumBannerProps) {
  const premiumProviders = useQuery(api.premium.getPremiumProviders, {
    categoryId,
    limit,
  });

  if (!premiumProviders || premiumProviders.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-accent-50 via-white to-primary-50 border border-accent-200/50 p-6">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-accent-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary-200/20 rounded-full blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-bl from-accent-400 to-accent-500 flex items-center justify-center">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>

        {/* Provider cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {premiumProviders.map((provider) => {
            if (!provider) return null;
            return (
              <Link
                key={provider._id}
                href={`/providers/${provider._id}`}
                className="block"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-border p-4 hover:shadow-md hover:border-accent-200 transition-all duration-200 group h-full">
                  <div className="flex items-start gap-3">
                    {provider.avatarUrl ? (
                      <div className="relative shrink-0">
                        <Image
                          src={provider.avatarUrl}
                          alt={provider.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover border-2 border-accent-200"
                        />
                        <PremiumBadge
                          variant="icon"
                          size="sm"
                          className="absolute -bottom-1 -left-1"
                        />
                      </div>
                    ) : (
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-lg font-bold border-2 border-accent-200">
                          {provider.name.charAt(0)}
                        </div>
                        <PremiumBadge
                          variant="icon"
                          size="sm"
                          className="absolute -bottom-1 -left-1"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm truncate">
                        {provider.name}
                      </h4>
                      <StarRating
                        rating={provider.avgRating}
                        size="sm"
                        className="mt-0.5"
                      />
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        {provider.reviewCount} تقييم
                      </p>
                    </div>
                  </div>

                  {provider.bio && (
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-2.5">
                      {provider.bio}
                    </p>
                  )}

                  {provider.serviceArea && provider.serviceArea.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-2">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {provider.serviceArea
                          .map((c) => cityLabels[c as string] ?? c)
                          .join("، ")}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-primary-500 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>عرض الملف</span>
                    <ArrowLeft className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
