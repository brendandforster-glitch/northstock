import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "", "/listings", "/buyer-requests", "/help",
    "/privacy", "/terms", "/marketplace-guidelines", "/sellers/getting-started",
  ];

  return routes.map((route) => ({
    url: `https://northstock.ca${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/listings" ? "daily" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
