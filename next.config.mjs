const nextConfig = {
  images: { unoptimized: true },
  experimental: {
    proxyClientMaxBodySize: "25mb",
  },
  allowedDevOrigins: ["127.0.0.1"],
  redirects: async () => [
    {
      source: "/p/:slug",
      destination: "/paper/:slug",
      permanent: true,
    },
  ],
};

export default nextConfig;
