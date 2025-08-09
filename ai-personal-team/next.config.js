/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  // Remove deprecated experimental option for better Vercel compatibility
  // experimental: {
  //   esmExternals: 'loose',
  // },
}

module.exports = nextConfig