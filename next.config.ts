import type { NextConfig } from "next";

/**
 * The site is a static export hosted on GitHub Pages (`npm run build` writes ./out).
 * Anything that needs a server lives elsewhere: the AI twin's chat runs in the Cloudflare Worker
 * in worker/, and scripts/postbuild.mjs finishes the preview images.
 */
const nextConfig: NextConfig = {
  output: "export",
  // Export pages as about/index.html rather than about.html: static hosts can't confuse the page with
  // the about/ folder that holds its data files, and GitHub Pages redirects /about to /about/.
  trailingSlash: true,
  // GitHub Pages has no image optimizer, so images are served as they are in /public.
  images: { unoptimized: true },
};

export default nextConfig;
