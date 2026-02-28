interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "حرفتي",
        alternateName: "Hirfati",
        url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hirfati.jo",
        description:
          "المنصة الأولى لربط الحرفيين المهرة بالعملاء في الأردن",
        inLanguage: "ar",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://hirfati.jo"}/categories?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

export function LocalBusinessJsonLd({
  name,
  description,
  url,
  image,
  rating,
  reviewCount,
  areaServed,
}: {
  name: string;
  description: string;
  url: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  areaServed?: string[];
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description,
    url,
    "@id": url,
    ...(image && { image }),
    ...(rating &&
      reviewCount && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: rating,
          reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
      }),
    ...(areaServed && {
      areaServed: areaServed.map((area) => ({
        "@type": "City",
        name: area,
      })),
    }),
  };

  return <JsonLd data={data} />;
}

export function ServiceJsonLd({
  name,
  description,
  provider,
  areaServed,
  price,
}: {
  name: string;
  description: string;
  provider: string;
  areaServed?: string;
  price?: number;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name,
        description,
        provider: {
          "@type": "LocalBusiness",
          name: provider,
        },
        ...(areaServed && {
          areaServed: {
            "@type": "City",
            name: areaServed,
          },
        }),
        ...(price && {
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: "JOD",
          },
        }),
      }}
    />
  );
}
