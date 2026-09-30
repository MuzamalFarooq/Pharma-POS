/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Standalone packaging for lean Docker containers
  output: 'standalone',

  // 2. Disable React strict mode warnings if third-party libraries misbehave, or keep enabled
  reactStrictMode: true,

  // 3. Security: Strip X-Powered-By: Next.js header
  poweredByHeader: false,

  // 4. Image Optimization config
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },

  // 5. Hardened HTTP Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
