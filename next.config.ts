import type { NextConfig } from "next";

const allowedDevOrigins = [
  "*.e2b.app",
  "localhost:3000",
  ...(process.env.ALLOWED_DEV_ORIGINS ?? "").split(",").filter(Boolean),
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  serverExternalPackages: ["@electric-sql/pglite", "pg", "bcryptjs"],
  images: {
    // Les logos sont des data URLs stockées en base : pas d'optimisation distante.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
