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
  output: process.env.NEXT_EXPORT === "true" ? "export" : "standalone",
  images: {
    unoptimized: process.env.NEXT_EXPORT === "true",
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
    const coreApi = process.env.CORE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const announcementApi = process.env.ANNOUNCEMENT_API_URL || process.env.NEXT_PUBLIC_ANNOUNCEMENT_API_URL || 'http://localhost:8001';
    const attendanceApi = process.env.ATTENDANCE_API_URL || process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || 'http://localhost:8002';
    const testApi = process.env.TEST_API_URL || process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003';
    const materialsApi = process.env.MATERIALS_API_URL || process.env.NEXT_PUBLIC_MATERIALS_API_URL || 'http://localhost:8005';
    const videoApi = process.env.VIDEO_API_URL || process.env.NEXT_PUBLIC_VIDEO_API_URL || 'http://localhost:8006';
    const communityApi = process.env.COMMUNITY_API_URL || process.env.NEXT_PUBLIC_COMMUNITY_API_URL || 'http://localhost:8009';

    return [
      {
        source: '/api/announcement/:path*',
        destination: `${announcementApi}/api/announcement/:path*`
      },
      {
        source: '/api/attendance/:path*',
        destination: `${attendanceApi}/api/attendance/:path*`
      },
      {
        source: '/api/tests/submissions/:path*',
        destination: `${testApi}/api/tests/submissions/:path*`
      },
      {
        source: '/api/tests/:path*',
        destination: `${testApi}/api/tests/:path*`
      },
      {
        source: '/api/materials/:path*',
        destination: `${materialsApi}/api/materials/:path*`
      },
      {
        source: '/api/video/:path*',
        destination: `${videoApi}/api/video/:path*`
      },
      {
        source: '/api/community/:path*',
        destination: `${communityApi}/api/community/:path*`
      },
      {
        source: '/api/:path*',
        destination: `${coreApi}/api/:path*`
      }
    ];
  }
};

export default withPWA(nextConfig);
