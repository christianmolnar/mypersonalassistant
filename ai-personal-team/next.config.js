/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  webpack(config) {
    return config;
  },
}

module.exports = nextConfig;
