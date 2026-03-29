import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@orinax/ui"],
  turbopack: {
    resolveAlias: {
      "@orinax/ui": path.resolve(__dirname, "../orinax-ui/index.ts"),
    },
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://my.orinax.ai https://analytics.orinax.ai",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
