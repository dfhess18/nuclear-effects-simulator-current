import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StorageNotice } from "@/components/shell/StorageNotice";
import { themeInitScript } from "@/lib/theme/themeScript";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = IBM_Plex_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  // Absolute base so OpenGraph images and canonicals resolve; without it Next
  // emits relative URLs that most crawlers and link unfurlers reject.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "MIT Laboratory for Nuclear Science" }],
  keywords: [
    "nuclear effects",
    "blast radius",
    "overpressure",
    "thermal radiation",
    "Glasstone and Dolan",
    "US Census block groups",
  ],
  // `/` and `/simulator` render the same tree at different phases, so without
  // an explicit canonical they read to a crawler as duplicate content.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // Covers the notch so the landing rail and results bar can use safe-area
  // insets instead of stopping short of the screen edge.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Prevent flash of unstyled theme on load. Shared with themeStore so
            the script and the store can never drift on the resolution rule. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geistSans.className} ${geistMono.variable} min-h-full flex flex-col`}>
        {/* 250 ms delay — long enough that sweeping the cursor across the
            legend or the metric row doesn't flash a trail of tooltips. */}
        <TooltipProvider delay={250}>
          {children}
          <StorageNotice />
        </TooltipProvider>
      </body>
    </html>
  );
}
