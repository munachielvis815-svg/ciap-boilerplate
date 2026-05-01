import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [30, 42, 75],
  },
  redirects: async () => {
    return [
      {
        source: '/insights',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/performance',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/sessions',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/settings',
        destination: '/dashboard?tab=settings',
        permanent: true,
      },
      {
        source: '/discovery',
        destination: '/dashboard?tab=market',
        permanent: true,
      },
    ];
  },
  rewrites: async () => {
    return {
      beforeFiles: [
        // Proxy API requests to backend
        {
          source: '/api-proxy/:path*',
          destination: 'http://localhost:3000/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
