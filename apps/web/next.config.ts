import type { NextConfig } from "next";

export default {
  reactStrictMode: true,
  reactCompiler: true,
  experimental: { turbopackFileSystemCacheForDev: true },
  typescript: { ignoreBuildErrors: false, tsconfigPath: "./tsconfig.json" },
  images: {
    loader: "default",
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      { pathname: "/highlights/**" },
      { pathname: "/icon/**" },
      { pathname: "/ideation/**" },
      { pathname: "/misc/**" },
      { pathname: "/providers/**" },
      { pathname: "/svgs/**" },
      { pathname: "/*" }
    ],
    qualities: [75, 80, 85, 90, 95, 100],
    dangerouslyAllowLocalIP: true,
    maximumRedirects: 5,
    contentDispositionType: "attachment",
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        hostname: "localhost",
        port: "3004",
        protocol: "http"
      },
      { hostname: "lh3.googleusercontent.com", protocol: "https" },
      {
        hostname: `turbogen.d0paminedriven.com`,
        protocol: "https"
      },
      {
        hostname: `dev.turbogen.d0paminedriven.com`,
        protocol: "https"
      },
      {
        hostname: `assets.aicoalesce.com`,
        protocol: "https"
      },
      {
        hostname: `assets-dev.aicoalesce.com`,
        protocol: "https"
      },
      { hostname: "raw.githubusercontent.com", protocol: "https" },
      { hostname: "imgen.x.ai", protocol: "https" },
      { hostname: "images.unsplash.com", protocol: "https" },
      { hostname: "tailwindcss.com", protocol: "https" }
    ]
  },
  productionBrowserSourceMaps: true
} satisfies NextConfig;
