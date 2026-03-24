/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // السماح بطلبات HTTP من server-side
  experimental: {
    serverActions: {
      allowedOrigins: ["jobsboard.mywebcommunity.org", "localhost:3000"],
    },
  },
  // إعدادات الأمان للسماح بـ HTTP requests
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
}

export default nextConfig
