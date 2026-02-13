/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
};

export default nextConfig;
