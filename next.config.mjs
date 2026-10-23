/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: {
    proxyClientMaxBodySize: "30mb",
  },
};

export default nextConfig;
