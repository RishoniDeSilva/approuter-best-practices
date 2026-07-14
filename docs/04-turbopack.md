# 4. Turbopack

Next.js 16 makes **Turbopack the default bundler** for both `next dev` and `next build`. It's a Rust-based, incremental bundler built by Vercel as the successor to webpack in Next.js.

## 4.1 What you get

| Metric | Improvement (vs. webpack) |
| --- | --- |
| Fast Refresh (HMR) | up to **5–10× faster** |
| Production builds | roughly **2–5× faster** |
| Dev server startup | significantly faster, scales with app size |

The wins come from:

- **Incremental computation** — Turbopack caches work at the function level; edits recompute only what changed.
- **Native code** — Rust, parallelized across cores, no JS bundler bottleneck.
- **Lazy bundling in dev** — only the routes you actually visit get compiled.

## 4.2 Zero-config in Next.js 16

```jsonc
// package.json — no flags needed anymore
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

If you were using `next dev --turbo` or `next dev --turbopack` on 14/15, delete the flag. To temporarily fall back to webpack while migrating:

```bash
next build --webpack   # escape hatch, webpack path is deprecated
```

## 4.3 Filesystem caching for large apps

Turbopack can persist its compilation cache to disk, so the *second* `next dev` / `next build` starts warm:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  turbopack: {
    // check your Next.js version's docs — this graduated from
    // experimental.turbopackFileSystemCacheForDev in early 16.x releases
  },
  experimental: {
    turbopackFileSystemCache: true,
  },
};
```

This matters most for very large apps and CI: cold-start compile times drop dramatically once the cache is primed. Persist `.next/cache` between CI runs to benefit.

## 4.4 Migrating custom webpack config

Most apps need **nothing** — CSS, CSS Modules, Sass, PostCSS, `next/font`, `next/image`, and TypeScript all work out of the box. If you have a custom `webpack()` function in `next.config`, translate it:

| webpack concept | Turbopack equivalent |
| --- | --- |
| `resolve.alias` | `turbopack.resolveAlias` |
| `resolve.extensions` | `turbopack.resolveExtensions` |
| custom loaders (`module.rules`) | `turbopack.rules` (webpack-loader compatible for many loaders) |
| `DefinePlugin` env constants | `env` in `next.config` / `NEXT_PUBLIC_*` vars |

```ts
// next.config.ts
const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: { underscore: "lodash" },
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};
```

Webpack **plugins** (as opposed to loaders) are not supported — check whether the plugin's job is already handled natively (most are: env vars, code splitting, minification, tree shaking) before looking for a replacement.

## 4.5 Best practices

1. **Don't keep a parallel webpack config "just in case".** Dual configs drift; commit to Turbopack and keep the webpack escape hatch only for the duration of a migration.
2. **Cache `.next/cache` in CI.** With filesystem caching, this is the single biggest CI-time win.
3. **Prefer native features over loaders.** SVGR, raw imports, and env handling have config-level solutions — every custom loader you drop makes builds faster and upgrades safer.
4. **Report regressions.** Turbopack aims for byte-compatible behavior with the webpack pipeline; if output differs, that's a bug worth filing, not working around.

---

**Next:** [5. What's New in Next.js 16 →](05-nextjs-16-features.md)
