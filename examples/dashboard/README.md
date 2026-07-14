# Example: App Router Best Practices Demo

A minimal Next.js 16 app that puts the guide's patterns into practice. No database needed — `lib/db.ts` is an in-memory mock with artificial latency so you can *see* streaming and caching happen.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## What to look at

| Route / file | Pattern demonstrated | Guide chapter |
| --- | --- | --- |
| `/dashboard` | Streaming with `<Suspense>` — the slow orders table (~1.5s) streams in without blocking the page | [2. SSR Performance](../../docs/02-ssr-performance.md) |
| `/products` | `"use cache"` + `cacheTag` + `cacheLife` at the query layer | [3. Caching](../../docs/03-caching-and-cache-components.md) |
| `/products/[id]` | Partial Pre-Rendering: cached product shell + per-request `CartStatus` (reads cookies) in a Suspense hole | [3. Caching](../../docs/03-caching-and-cache-components.md) |
| `features/` | Feature-module structure; routes stay thin | [1. Project Structure](../../docs/01-project-structure.md) |
| `features/products/actions.ts` | Server Action setting a cookie, called from a client leaf | [1](../../docs/01-project-structure.md) / [2](../../docs/02-ssr-performance.md) |
| `features/products/components/AddToCartButton.tsx` | `"use client"` at the leaf, `useTransition` pending state | [2. SSR Performance](../../docs/02-ssr-performance.md) |
| `proxy.ts` | The Next.js 16 replacement for `middleware.ts` | [5. Next.js 16](../../docs/05-nextjs-16-features.md) |
| `next.config.ts` | `cacheComponents` + `reactCompiler` enabled | [5. Next.js 16](../../docs/05-nextjs-16-features.md) |

## Things to try

1. Open `/dashboard` — watch the skeletons: stats pop in fast, orders ~1.5s later.
2. Open `/products` twice — the second load is instant (cached, 300ms mock latency skipped).
3. On a product page, click **Add to cart** — the cached shell stays static while the personalized cart count updates per request.
4. Run `npm run build` and read the route table: `/products` is prerendered (`●`), `/dashboard` is dynamic, `/products/[id]` is partially prerendered.
