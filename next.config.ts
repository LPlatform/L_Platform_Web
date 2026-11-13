import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Local dev: read the single shared workspace .env one folder up. Vercel injects real env vars.
loadEnvConfig(path.resolve(process.cwd(), ".."));

// Production (Vercel): browser calls same-origin /api/*, proxied here to the backend so the
// HttpOnly auth cookies stay first-party for this domain.
const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  outputFileTracingRoot: process.cwd(),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return backendUrl ? [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }] : [];
  },
};

export default nextConfig;
