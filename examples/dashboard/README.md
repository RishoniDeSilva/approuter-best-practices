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
| `/reports` → `/reports/[id]` → `/reports/new` | Damage-reports domain: cached list, details with `notFound()`, create form | [6. Error Handling](../../docs/06-error-handling.md) |
| `/reports/new` | Expected errors as values: `useActionState` + shared `FormState` union, field-level errors | [6. Error Handling](../../docs/06-error-handling.md) |
| `/dashboard` conversion widget | Section error boundary + retry around a deliberately flaky data source | [6. Error Handling](../../docs/06-error-handling.md) |
| `app/error.tsx`, `app/dashboard/error.tsx`, `app/global-error.tsx` | Layered boundaries with the `router.refresh()` + `reset()` retry pattern | [6. Error Handling](../../docs/06-error-handling.md) |
| `instrumentation.ts` | `onRequestError` — one reporting point for all server errors | [6. Error Handling](../../docs/06-error-handling.md) |
| `next.config.ts` | `cacheComponents` + `reactCompiler` enabled | [5. Next.js 16](../../docs/05-nextjs-16-features.md) |

## Things to try

1. Open `/dashboard` — watch the skeletons: stats pop in fast, orders ~1.5s later.
2. Open `/products` twice — the second load is instant (cached, 300ms mock latency skipped).
3. On a product page, click **Add to cart** — the cached shell stays static while the personalized cart count updates per request.
4. Run `npm run build` and read the route table: `/products` is prerendered (`●`), `/dashboard` is dynamic, `/products/[id]` is partially prerendered.
5. On `/dashboard`, the conversion-rate widget fails ~50% of the time — hit **Retry** and watch only that card recover while the rest of the page stays alive.
6. Create a damage report at `/reports/new` with empty fields — validation errors render next to each field (expected errors as values, input preserved).
7. Create one with **"boom"** in the title — the simulated DB failure throws, the app-wide `app/error.tsx` catches it, and the terminal shows the structured `[server-error]` log from `instrumentation.ts` with a matching digest.
8. Visit `/reports/does-not-exist` — the segment's contextual `not-found.tsx` renders with a 404.
9. Click **💥 Crash the dashboard** on `/dashboard` — a client component throws during render, `app/dashboard/error.tsx` replaces the page (nav stays alive), and **Try again** recovers because reset remounts the crashed component with fresh state.
10. Click **💥 Crash the app shell** on the home page — no segment `error.tsx` there, so the same crash bubbles to the app-wide `app/error.tsx` instead. That's the boundary ladder in action.
11. The only layer without a button is `global-error.tsx`: it fires solely for **root layout** crashes, so temporarily add `throw new Error("test")` inside `RootLayout` (`app/layout.tsx`) to see it.

> In `next dev`, Next's error overlay/toast appears on top of boundary UI — dismiss it, or use `npm run build && npm start` to see exactly what users see.
