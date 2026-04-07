/** @type {import('next').NextConfig} */
const nextConfig = {
  // SSR — Amplify faz proxy para EC2, browser nunca fala com EC2 diretamente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
