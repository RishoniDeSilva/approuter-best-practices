# 5. What's New in Next.js 16

Next.js 16 (released October 2025) is the biggest App Router release since 13. This chapter summarizes the headline features and the breaking changes you'll hit when upgrading.

## 5.1 Headline features

### Turbopack is the default bundler (stable)

`next dev` and `next build` now use Turbopack with no flags — 2–5× faster builds, up to 10× faster Fast Refresh. Details and migration notes in [Chapter 4](04-turbopack.md).

### Cache Components & `"use cache"`

The old implicit caching layers (fetch cache, full route cache with surprising defaults) are gone in favor of a single explicit directive. Pages, components, and functions opt into caching with `"use cache"`, controlled by `cacheLife()` and invalidated by `cacheTag()` with `updateTag()` (Server Actions) or `revalidateTag()` (webhooks/handlers). Partial Pre-Rendering serves cached shells instantly while dynamic holes stream. Full guide in [Chapter 3](03-caching-and-cache-components.md).

### `proxy.ts` replaces `middleware.ts`

Same API, clearer name: the file runs at the **network boundary**, in front of routing.

```ts
// proxy.ts (was middleware.ts)
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.cookies.has("session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
```

The rename also signals a best practice: this layer is for **routing concerns** (redirects, rewrites, header checks), *not* for heavy auth logic or data access — do real authorization in the layout/page/action where the data lives.

### React Compiler support (stable)

One flag enables automatic memoization of Client Components — most hand-written `useMemo`, `useCallback`, and `React.memo` become unnecessary:

```ts
// next.config.ts
const nextConfig: NextConfig = { reactCompiler: true };
```

### Next.js DevTools MCP

Next.js 16 ships a Model Context Protocol server so AI coding agents can inspect your running dev server — routes, errors, rendering behavior, logs — and debug with real context instead of guesses.

### Improved logging

`next dev` and `next build` output got a major overhaul: clearer per-request logs in development and more transparent build-phase timing.

### React 19.2

Next.js 16 bundles React 19.2, bringing `<Activity />` for pre-rendering hidden UI, `useEffectEvent`, and Performance-panel integration for React rendering work.

## 5.2 Breaking changes & upgrade checklist

| Change | What to do |
| --- | --- |
| **Node.js 20.9+ required** | Upgrade runtime; Node 18 is EOL and unsupported |
| **`params` / `searchParams` are Promises** (sync access removed) | `const { id } = await params` in pages/layouts/handlers; `use(params)` in Client Components |
| **`middleware.ts` → `proxy.ts`** | Rename file and export (`middleware` → `proxy`) |
| **AMP support removed** | Remove `useAmp` / AMP config |
| **`next lint` removed** | Run ESLint/Biome directly; migrate with `npx @next/codemod` |
| **Old implicit fetch caching removed** | Adopt `"use cache"` per [Chapter 3](03-caching-and-cache-components.md) |
| **`next/image` default changes** | Review `qualities`, local-IP `remotePatterns`, and `minimumCacheTTL` behavior |
| **Turbopack default** | Delete `--turbopack` flags; migrate custom webpack config or use `--webpack` temporarily |

### Automated upgrade

```bash
npx @next/codemod@canary upgrade latest
```

The codemod handles most mechanical changes (async `params`, renamed files, removed flags) automatically.

## 5.3 Recommended `next.config.ts` for a new Next.js 16 app

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicit, opt-in caching + Partial Pre-Rendering
  cacheComponents: true,

  // Automatic memoization for Client Components
  reactCompiler: true,

  // Typed routes for compile-time-safe <Link href>
  typedRoutes: true,

  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.example.com" }],
  },
};

export default nextConfig;
```

> Flag names occasionally move between `experimental` and top-level across minor versions — if the build warns about an unrecognized key, check the [upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) for your exact version.

## 5.4 Adoption strategy

1. **Upgrade first, adopt later.** Run the codemod, get the app building on 16 with Turbopack, ship it.
2. **Enable React Compiler** — low risk, measurable client-side wins.
3. **Turn on `cacheComponents` in a branch.** The build will point out every page where dynamic APIs need a `<Suspense>` boundary — fix those, then add `"use cache"` deliberately, starting with high-traffic, low-personalization pages.
4. **Delete your memoization.** Once the compiler is on and profiled, remove hand-written `useMemo`/`useCallback` in touched files as you go.

## Further reading

- [Next.js 16 announcement](https://nextjs.org/blog/next-16)
- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Cache Components documentation](https://nextjs.org/docs/app/getting-started/cache-components)

---

**Next:** [6. Error Handling →](06-error-handling.md)
