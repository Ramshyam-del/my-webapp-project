/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Exclude debug and test pages from production builds
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  
  webpack: (config, { isServer, dev }) => {
    // Exclude debug/test pages in production
    if (!dev && isServer) {
      config.externals = config.externals || [];
    }
    return config;
  },

  // Exclude debug pages from production build
  excludeDefaultMomentLocales: true,
  
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

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;