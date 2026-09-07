import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Legacy redirect stub; nothing to index there.
      disallow: ["/boston"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
