import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SERPAPI_KEY: process.env.SERPAPI_KEY,
    GOOGLE_FACT_CHECK_API_KEY: process.env.GOOGLE_FACT_CHECK_API_KEY,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  swcMinify: true,
};

export default nextConfig;
