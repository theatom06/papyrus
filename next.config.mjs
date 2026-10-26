/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: {
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
