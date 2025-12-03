import type { NextConfig } from "next";

const nextConfig: NextConfig = {

   // Add eslint configuration here
   eslint: {
    // Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
 
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
};

export default nextConfig;
