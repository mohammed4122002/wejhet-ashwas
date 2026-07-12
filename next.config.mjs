import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {};

// Serwist — Service Worker لتخزين أصول التطبيق والعمل بدون نت (خطة §ب.5 بند 6)
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // لا نفعّل الـSW بالتطوير حتى لا يتداخل مع الـHMR
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
