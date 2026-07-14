import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicit, opt-in caching + Partial Pre-Rendering (Chapter 3)
  cacheComponents: true,

  // Automatic memoization for Client Components (Chapter 5)
  reactCompiler: true,
};

export default nextConfig;
