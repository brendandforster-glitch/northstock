import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "NorthStock",
  title: {
    default: "NorthStock",
    template: "%s | NorthStock",
  },

  description:
    "NorthStock is a free global marketplace for used, surplus, and overstock commercial inventory, including office furniture, restaurant equipment, hotel supplies, commercial gym equipment, and more.",

  keywords: [
    "commercial inventory",
    "business inventory",
    "surplus inventory",
    "office furniture",
    "restaurant equipment",
    "hotel supplies",
    "commercial gym equipment",
    "used equipment",
    "industrial inventory",
    "NorthStock",
  ],

  metadataBase: new URL("https://northstock.ca"),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },

  openGraph: {
    title: "NorthStock",
    description: "The Global Commercial Inventory Marketplace",
    url: "https://northstock.ca",
    siteName: "NorthStock",
    type: "website",
    images: [{ url: "/northstock-logo.png", alt: "NorthStock" }],
  },

  twitter: {
    card: "summary_large_image",
    title: "NorthStock",
    description: "The Global Commercial Inventory Marketplace",
    images: ["/northstock-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
  {children}

  <Script
    src="https://www.googletagmanager.com/gtag/js?id=G-G2HZEZPEXL"
    strategy="afterInteractive"
  />

  <Script id="google-analytics" strategy="afterInteractive">
    {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-G2HZEZPEXL');
    `}
  </Script>
</body>
    </html>
  );
}
