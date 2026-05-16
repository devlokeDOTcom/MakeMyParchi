import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {},
};

// `npm run dev` → lifecycle "dev" (no PWA / webpack plugins).
// `npm run build` → lifecycle "build" (PWA + webpack via --webpack flag).
const enablePwa = process.env.npm_lifecycle_event === "build";

let config = nextConfig;

if (enablePwa) {
  const { default: withPWAInit } = await import("@ducanh2912/next-pwa");
  const withPWA = withPWAInit({
    dest: "public",
    disable: false,
    register: true,
    reloadOnOnline: true,
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    cacheStartUrl: true,
    dynamicStartUrl: true,
    fallbacks: {
      document: "/offline",
    },
    workboxOptions: {
      disableDevLogs: true,
    },
  });
  config = withPWA(nextConfig);
}

export default config;
