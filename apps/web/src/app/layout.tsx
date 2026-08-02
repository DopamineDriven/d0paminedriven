import type { Metadata, Viewport } from "next";
import React from "react";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { PageLayout } from "@/ui/page-layout";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import "@d0paminedriven/ui/globals.css";
import Script from "next/script";
import { CookieProvider } from "@/context/cookie-context";
import { getSiteUrl } from "@/lib/site-url";

/* populate relevant values in src/lib/site-url.ts and uncomment for url injetion */
// import { getSiteUrl } from "@/lib/site-url";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"]
});

export const viewport = {
  colorScheme: "normal",
  themeColor: "#0a0a0a",
  viewportFit: "cover",
  maximumScale: 1,
  userScalable: false,
  initialScale: 1,
  width: "device-width"
} satisfies Viewport;

export const metadata: Metadata = {
  /* populate relevant values in src/lib/site-url.ts and uncomment for url injetion */
  metadataBase: new URL(getSiteUrl(process.env.VERCEL_ENV)),
  title: {
    default: "@d0paminedriven/web",
    template: "%s | @d0paminedriven/web"
  },
  description: "@d0paminedriven/web scaffolded by @d0paminedriven/turbogen"
} satisfies Metadata;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable}`}>
      <Script
        async={true}
        strategy="beforeInteractive"
        id="prevent-flash-of-wrong-theme"
        dangerouslySetInnerHTML={{
          __html: `
              (function() {
                try {
                  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (prefersDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `
        }}
      />
      <body
        className={cn(
          "bg-background font-cal-sans m-0 h-dvh w-screen overflow-x-hidden p-0 antialiased"
        )}>
        <CookieProvider>
          <ThemeProvider attribute={"class"} defaultTheme="system" enableSystem>
            <PageLayout>{children}</PageLayout>
          </ThemeProvider>
        </CookieProvider>
      </body>
    </html>
  );
}
