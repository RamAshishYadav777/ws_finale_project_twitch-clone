/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "**",
      },
    ],
  },

  output: "standalone",

  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
  },
};

module.exports = nextConfig;
