/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Necessário para deploy no Amplify/Docker
  experimental: {
    serverComponentsExternalPackages: [],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
