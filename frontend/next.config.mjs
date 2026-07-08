/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/peoples-priorities-portal',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
