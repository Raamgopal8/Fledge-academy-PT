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
    const defaultGateway = process.env.NEXT_PUBLIC_API_URL || 'https://fledgeportal-backend-844515198625.us-central1.run.app';
    const coreApi = process.env.CORE_API_URL || defaultGateway;
    const announcementApi = process.env.ANNOUNCEMENT_API_URL || process.env.NEXT_PUBLIC_ANNOUNCEMENT_API_URL || defaultGateway;
    const attendanceApi = process.env.ATTENDANCE_API_URL || process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || defaultGateway;
    const testApi = process.env.TEST_API_URL || process.env.NEXT_PUBLIC_TEST_API_URL || defaultGateway;
    const materialsApi = process.env.MATERIALS_API_URL || process.env.NEXT_PUBLIC_MATERIALS_API_URL || defaultGateway;
    const videoApi = process.env.VIDEO_API_URL || process.env.NEXT_PUBLIC_VIDEO_API_URL || defaultGateway;
    const communityApi = process.env.COMMUNITY_API_URL || process.env.NEXT_PUBLIC_COMMUNITY_API_URL || defaultGateway;

    return [
      {
        source: '/api/announcement',
        destination: `${announcementApi}/api/announcement`
      },
      {
        source: '/api/announcement/:path*',
        destination: `${announcementApi}/api/announcement/:path*`
      },
      {
        source: '/api/attendance',
        destination: `${attendanceApi}/api/attendance`
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
        source: '/api/tests',
        destination: `${testApi}/api/tests`
      },
      {
        source: '/api/tests/:path*',
        destination: `${testApi}/api/tests/:path*`
      },
      {
        source: '/api/materials',
        destination: `${materialsApi}/api/materials`
      },
      {
        source: '/api/materials/:path*',
        destination: `${materialsApi}/api/materials/:path*`
      },
      {
        source: '/api/video',
        destination: `${videoApi}/api/video`
      },
      {
        source: '/api/video/:path*',
        destination: `${videoApi}/api/video/:path*`
      },
      {
        source: '/api/videos',
        destination: `${videoApi}/api/videos`
      },
      {
        source: '/api/videos/:path*',
        destination: `${videoApi}/api/videos/:path*`
      },
      {
        source: '/api/community',
        destination: `${communityApi}/api/community`
      },
      {
        source: '/api/community/:path*',
        destination: `${communityApi}/api/community/:path*`
      },
      {
        source: '/api',
        destination: `${coreApi}/api`
      },
      {
        source: '/api/:path*',
        destination: `${coreApi}/api/:path*`
      }
    ];
  }
};

export default withPWA(nextConfig);
