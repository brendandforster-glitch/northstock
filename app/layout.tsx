import type { Metadata } from "next";
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
  title: {
    default: "NorthStock",
    template: "%s | NorthStock",
  },

  description:
    "NorthStock is North America's commercial inventory marketplace. Buy and sell office furniture, restaurant equipment, contractor tools, and surplus business inventory.",

  keywords: [
    "commercial inventory",
    "business inventory",
    "surplus inventory",
    "office furniture",
    "restaurant equipment",
    "contractor tools",
    "used equipment",
    "industrial inventory",
    "NorthStock",
  ],

  metadataBase: new URL("https://northstock.ca"),

  openGraph: {
    title: "NorthStock",
    description: "North America's Commercial Inventory Marketplace",
    url: "https://northstock.ca",
    siteName: "NorthStock",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "NorthStock",
    description: "North America's Commercial Inventory Marketplace",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
