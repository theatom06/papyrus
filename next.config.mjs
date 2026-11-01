/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: {
    proxyClientMaxBodySize: "25mb",
  },
  redirects: async () => [
    {
      source: "/p/:slug",
      destination: "/paper/:slug",
      permanent: true,
    },
  ],
};

export default nextConfig;
