import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@orinax/ui"],
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
