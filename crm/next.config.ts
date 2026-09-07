import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Native/Node-only packages must stay external to the server bundle
  serverExternalPackages: ["mssql", "tedious", "@node-rs/argon2"],
  // The marketing site sits one level up with its own lockfile; without this
  // Next infers the parent as the workspace root and traces the wrong files.
  outputFileTracingRoot: import.meta.dirname,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
          // an internal tool has no business being indexed
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
