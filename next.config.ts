import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/v1/map/geography": ["./data/natural-earth-10m.json"],
    "/api/v1/health": ["./data/natural-earth-10m.json"],
    "/api/countries": ["./data/natural-earth-10m.json"],
    "/api/quiz": ["./data/natural-earth-10m.json"],
  },
};

export default nextConfig;
