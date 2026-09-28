/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,

  // No "browserslist" in package.json, on purpose: Next's own modern targets
  // apply. The old "last 2 ... versions" list resolved to browser versions
  // newer than Turbopack's built-in data knows (Chrome 144, Safari 26), and
  // Turbopack then quietly compiled the whole site down to old-browser
  // JavaScript - whose rewrite of `??` crashed PMS pages ("_room_0_base_rate
  // is not defined", 2026-09-28).

  // Image optimization for SEO
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000, // 30 days
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Enable static page generation (default behavior, explicitly configured)
  // Homepage and blog listing will be statically generated at build time
  // Blog posts will use ISR (Incremental Static Regeneration)
  output: 'standalone',
  
  // Optimize for production
  compress: true,
  
  // Generate ETags for better caching
  generateEtags: true,
  
  // Power by header removal for security
  poweredByHeader: false,
};

export default nextConfig;
