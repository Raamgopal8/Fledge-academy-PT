import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  turbopack: {},
  reactCompiler: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/announcement/:path*',
        destination: 'http://localhost:8001/api/announcement/:path*'
      },
      {
        source: '/api/attendance/:path*',
        destination: 'http://localhost:8002/api/attendance/:path*'
      },
      {
        source: '/api/tests/submissions/:path*',
        destination: 'http://localhost:8003/api/tests/submissions/:path*'
      },
      {
        source: '/api/tests/:path*',
        destination: 'http://localhost:8003/api/tests/:path*'
      },
      {
        source: '/api/materials/:path*',
        destination: 'http://localhost:8005/api/materials/:path*'
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*'
      }
    ];
  }
};

export default withPWA(nextConfig);
