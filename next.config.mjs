/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
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
        destination: 'http://localhost:8004/api/tests/submissions/:path*'
      },
      {
        source: '/api/tests/:path*',
        destination: 'http://localhost:8003/api/tests/:path*'
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*'
      }
    ];
  }
};

export default nextConfig;
