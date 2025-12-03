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

  experimental: {
    outputFileTracing: false,
  },
};

module.exports = nextConfig;
