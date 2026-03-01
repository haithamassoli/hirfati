"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import {
  ProviderCardSkeleton,
  ServiceCardSkeleton,
  RequestCardSkeleton,
} from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  Crown,
  Banknote,
  MessageSquareQuote,
  Calendar,
  ChevronLeft,
  SearchX,
  Users,
  Briefcase,
  FileText,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cityLabels } from "@/lib/constants";

type City = "amman" | "irbid" | "zarqa";
type Tab = "providers" | "services" | "requests";

const cities: { value: City | "all"; label: string }[] = [
  { value: "all", label: "جميع المدن" },
  { value: "amman", label: "عمّان" },
  { value: "irbid", label: "إربد" },
  { value: "zarqa", label: "الزرقاء" },
];

const tabs: { value: Tab; label: string; icon: typeof Users }[] = [
  { value: "providers", label: "الحرفيون", icon: Users },
  { value: "services", label: "الخدمات", icon: Briefcase },
  { value: "requests", label: "الطلبات", icon: FileText },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") ?? "";
  const initialCity = (searchParams.get("city") as City) || undefined;

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [debouncedTerm, setDebouncedTerm] = useState(initialQuery);
  const [selectedCity, setSelectedCity] = useState<City | "all">(
    initialCity ?? "all"
  );
  const [activeTab, setActiveTab] = useState<Tab>("providers");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync URL with search state
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedTerm) params.set("q", debouncedTerm);
    if (selectedCity !== "all") params.set("city", selectedCity);
    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(newUrl, { scroll: false });
  }, [debouncedTerm, selectedCity, router]);

  const cityFilter = selectedCity === "all" ? undefined : selectedCity;
  const hasSearchTerm = debouncedTerm.trim().length > 0;

  const providers = useQuery(
    api.providers.search,
    hasSearchTerm ? { term: debouncedTerm, city: cityFilter } : "skip"
  );
  const services = useQuery(
    api.services.search,
    hasSearchTerm ? { term: debouncedTerm } : "skip"
  );
  const requests = useQuery(
    api.requests.search,
    hasSearchTerm
      ? { term: debouncedTerm, city: cityFilter }
      : "skip"
  );

  const providerCount = providers?.length ?? 0;
  const serviceCount = services?.length ?? 0;
  const requestCount = requests?.length ?? 0;
  const totalCount = providerCount + serviceCount + requestCount;

  const getTabCount = useCallback(
    (tab: Tab) => {
      switch (tab) {
        case "providers":
          return providerCount;
        case "services":
          return serviceCount;
        case "requests":
          return requestCount;
      }
    },
    [providerCount, serviceCount, requestCount]
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Search Header */}
      <div className="bg-gradient-to-bl from-primary-50 via-background to-accent-50 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          {/* Search Input */}
          <div className="flex gap-2 bg-surface rounded-2xl p-2 shadow-lg border border-border mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث عن حرفي أو خدمة..."
                className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-transparent text-foreground placeholder:text-neutral-400 focus:outline-none text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* City Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-5">
            {cities.map((city) => (
              <button
                key={city.value}
                onClick={() => setSelectedCity(city.value)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  selectedCity === city.value
                    ? "bg-primary-500 text-white shadow-sm"
                    : "bg-surface text-neutral-600 border border-border hover:bg-neutral-50"
                }`}
              >
                {city.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
            {tabs.map((tab) => {
              const count = getTabCount(tab.value);
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {hasSearchTerm && count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-primary-100 text-primary-700"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasSearchTerm ? (
          <EmptySearch />
        ) : (
          <>
            {hasSearchTerm && totalCount > 0 && (
              <p className="text-sm text-neutral-500 mb-6">
                تم العثور على{" "}
                <span className="font-semibold text-foreground">
                  {totalCount}
                </span>{" "}
                نتيجة
              </p>
            )}

            {activeTab === "providers" && (
              <ProviderResults providers={providers} />
            )}
            {activeTab === "services" && (
              <ServiceResults services={services} />
            )}
            {activeTab === "requests" && (
              <RequestResults requests={requests} />
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

function EmptySearch() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-3xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
        <Search className="h-10 w-10 text-primary-300" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        ابحث عن حرفيين وخدمات
      </h3>
      <p className="text-neutral-500 max-w-md mx-auto mb-8">
        اكتب اسم الخدمة أو الحرفي الذي تبحث عنه للعثور على أفضل النتائج
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm text-neutral-400">جرّب:</span>
        {["سباكة", "كهرباء", "دهان", "نجارة", "تكييف"].map((term) => (
          <Link
            key={term}
            href={`/search?q=${encodeURIComponent(term)}`}
            className="text-sm px-3 py-1.5 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
          >
            {term}
          </Link>
        ))}
      </div>
    </div>
  );
}

function NoResults({ label }: { label: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
        <SearchX className="h-8 w-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        لا توجد نتائج
      </h3>
      <p className="text-neutral-500 text-sm">
        لم نجد {label} مطابقة. جرّب كلمات بحث مختلفة.
      </p>
    </div>
  );
}

function ProviderResults({
  providers,
}: {
  providers:
    | {
        _id: string;
        name: string;
        bio?: string;
        avatarUrl?: string;
        serviceArea?: string[];
        isPremium: boolean;
        avgRating: number;
        reviewCount: number;
        serviceCount: number;
      }[]
    | undefined;
}) {
  if (providers === undefined) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProviderCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (providers.length === 0) return <NoResults label="حرفيين" />;

  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <Link key={provider._id} href={`/providers/${provider._id}`}>
          <Card hover className="group">
            <CardContent className="flex items-start gap-4">
              <div className="relative shrink-0">
                {provider.avatarUrl ? (
                  <Image
                    src={provider.avatarUrl}
                    alt={provider.name}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-lg font-bold">
                    {provider.name.charAt(0)}
                  </div>
                )}
                {provider.isPremium && (
                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                    {provider.name}
                  </h3>
                  {provider.isPremium && (
                    <Badge variant="premium" className="text-[10px] px-2 py-0">
                      مميز
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <StarRating rating={provider.avgRating} size="sm" />
                  <span className="text-xs text-neutral-500">
                    ({provider.reviewCount} تقييم)
                  </span>
                  <span className="text-xs text-neutral-400">·</span>
                  <span className="text-xs text-neutral-500">
                    {provider.serviceCount} خدمة
                  </span>
                </div>

                {provider.bio && (
                  <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                    {provider.bio}
                  </p>
                )}

                {provider.serviceArea && provider.serviceArea.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {provider.serviceArea
                        .map((c) => cityLabels[c] ?? c)
                        .join("، ")}
                    </span>
                  </div>
                )}
              </div>

              <ChevronLeft className="h-5 w-5 text-neutral-400 group-hover:text-primary-500 transition-colors shrink-0 mt-2" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function ServiceResults({
  services,
}: {
  services:
    | {
        _id: string;
        title: string;
        description: string;
        price: number;
        priceType: string;
        providerId: string;
        providerName: string;
        providerAvatar?: string;
        providerRating: number;
        providerReviewCount: number;
        categoryNameAr: string;
        categorySlug: string;
      }[]
    | undefined;
}) {
  if (services === undefined) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (services.length === 0) return <NoResults label="خدمات" />;

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <Link key={service._id} href={`/providers/${service.providerId}`}>
          <Card hover className="group">
            <CardContent>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary-600 transition-colors mb-1">
                    {service.title}
                  </h3>
                  <Badge variant="primary" className="text-[10px]">
                    {service.categoryNameAr}
                  </Badge>
                </div>
                <div className="text-left shrink-0">
                  <span className="text-lg font-bold text-primary-600">
                    {service.price}
                  </span>
                  <span className="text-xs text-neutral-500 mr-1">د.أ</span>
                  {service.priceType === "flexible" && (
                    <p className="text-[10px] text-neutral-400">سعر مرن</p>
                  )}
                </div>
              </div>

              <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                {service.description}
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-border">
                {service.providerAvatar ? (
                  <Image
                    src={service.providerAvatar}
                    alt={service.providerName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">
                    {service.providerName.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">
                  {service.providerName}
                </span>
                <div className="flex items-center gap-1 mr-auto">
                  <StarRating rating={service.providerRating} size="sm" />
                  <span className="text-xs text-neutral-500">
                    ({service.providerReviewCount})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function RequestResults({
  requests,
}: {
  requests:
    | {
        _id: string;
        title: string;
        description: string;
        city: string;
        budgetMin: number;
        budgetMax: number;
        categoryNameAr: string;
        customerName: string;
        quoteCount: number;
        photoUrls: string[];
        _creationTime: number;
      }[]
    | undefined;
}) {
  if (requests === undefined) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <RequestCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (requests.length === 0) return <NoResults label="طلبات" />;

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Link key={request._id} href={`/requests/${request._id}`}>
          <Card hover className="group">
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {request.photoUrls.length > 0 && (
                  <Image
                    src={request.photoUrls[0]}
                    alt={request.title}
                    width={120}
                    height={96}
                    className="w-full sm:w-[120px] h-24 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                      {request.title}
                    </h3>
                    <Badge variant="primary" className="shrink-0 text-[10px]">
                      {request.categoryNameAr}
                    </Badge>
                  </div>

                  <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                    {request.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
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
                      {request.quoteCount} عرض
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(request._creationTime).toLocaleDateString(
                        "ar-JO"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
