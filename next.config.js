/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/api/admin/:path*',
        destination: '/api/admin/:path*', // Keep admin routes local for proxy handling
      },
      {
        source: '/api/portfolio/:path*',
        destination: '/api/portfolio/:path*', // Keep portfolio routes local
      },
      {
        source: '/api/crypto/:path*',
        destination: '/api/crypto/:path*', // Keep crypto routes local
      },
      {
        source: '/api/trading/:path*',
        destination: '/api/trading/:path*', // Keep trading routes local
      },
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;