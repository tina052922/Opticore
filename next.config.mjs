/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [],
  },
  async redirects() {
    return [{ source: "/favicon.ico", destination: "/icon.svg", permanent: false }];
  },
};

export default nextConfig;

