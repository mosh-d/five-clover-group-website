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

  // The whole site is exported as plain files (owner, 2026-11-05: Cloudflare's
  // FREE plan, 10 ms of CPU a request - plain files use none). Every page is
  // built here, at build time; nothing is rendered per visit. So:
  // - no per-request pages: the blog is paused for this (docs/BLOG-PAUSED.md);
  // - no server-side redirects or headers: on Cloudflare they are the owner's
  //   Redirect Rules (backend docs/OWNER-SETUP.md part 1, step 4) and
  //   public/_headers; while Vercel still serves the site, vercel.json;
  // - no per-visitor picture resizing: pictures are served as built.
  output: 'export',
  images: {
    unoptimized: true,
  },

  // Power by header removal for security
  poweredByHeader: false,
};

export default nextConfig;
