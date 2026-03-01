import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { WebsiteJsonLd } from "@/components/seo/json-ld";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "حرفتي — سوق الحرفيين في الأردن",
    template: "%s | حرفتي",
  },
  description:
    "اعثر على أفضل الحرفيين في الأردن — سباكة، كهرباء، نجارة، حدادة، دهان، تكييف، بلاط وصيانة عامة. احصل على عروض أسعار مجانية.",
  keywords: [
    "حرفيين",
    "الأردن",
    "سباكة",
    "كهرباء",
    "نجارة",
    "حدادة",
    "صيانة",
    "عمان",
    "إربد",
    "الزرقاء",
  ],
  authors: [{ name: "Hirfati" }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://hirfati.jo"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_JO",
    siteName: "حرفتي",
    title: "حرفتي — سوق الحرفيين في الأردن",
    description:
      "اعثر على أفضل الحرفيين في الأردن. احصل على عروض أسعار مجانية من حرفيين موثوقين.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={ibmPlexArabic.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <WebsiteJsonLd />
        <ConvexClientProvider>
          {children}
          <InstallPrompt />
        </ConvexClientProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
