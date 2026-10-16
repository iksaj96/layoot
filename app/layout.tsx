import type { Metadata, Viewport } from "next";
import "./globals.css";
import SwRegister from "@/components/SwRegister";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Layoot — Desain selebaran dan majalah",
    template: "%s | Layoot",
  },
  description:
    "Rancang selebaran dan majalah ukuran A4 dan F4 langsung dari browser.",
  applicationName: "Layoot",
  keywords: [
    "desain selebaran",
    "desain majalah",
    "editor brosur online",
    "layout A4",
    "layout F4",
    "Layoot",
  ],
  authors: [{ name: "Layoot" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Layoot",
    title: "Layoot — Desain selebaran dan majalah",
    description:
      "Rancang selebaran dan majalah ukuran A4 dan F4 langsung dari browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Layoot — Desain selebaran dan majalah",
    description:
      "Rancang selebaran dan majalah ukuran A4 dan F4 langsung dari browser.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  appleWebApp: {
    capable: true,
    title: "Layoot",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  // verification: { google: "KODE_GOOGLE_SEARCH_CONSOLE" },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Layoot",
  url: SITE_URL,
  description:
    "Editor desain selebaran dan majalah ukuran A4 dan F4 berbasis browser.",
  applicationCategory: "DesignApplication",
  operatingSystem: "Any",
  inLanguage: "id",
  offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="font-sans">
        {children}
        <SwRegister />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}