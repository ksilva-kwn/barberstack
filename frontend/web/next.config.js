/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone: gera servidor Node.js auto-contido em .next/standalone
  // necessário para Amplify WEB_COMPUTE rodar o SSR via Lambda
  output: 'standalone',
};

module.exports = nextConfig;
