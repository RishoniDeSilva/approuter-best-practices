# 3. Caching & Cache Components (`use cache`)

Next.js 16 replaces the App Router's old implicit caching (which surprised almost everyone) with an **explicit, opt-in model** called **Cache Components**. The mental model is finally simple:

> **Everything is dynamic unless you say `"use cache"`.**

## 3.1 Enabling Cache Components

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

With this flag on:

- No implicit fetch caching, no implicit route caching.
- `"use cache"` is the single way to make something static/shared.
- Partial Pre-Rendering (PPR) is active: cached parts of a page are served instantly from the edge/CDN while dynamic holes stream in.

## 3.2 The `"use cache"` directive

Apply it at three levels:

### A whole page

```tsx
// app/blog/[slug]/page.tsx
"use cache";

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return <Article post={post} />;
}
```

### A component

```tsx
// Cached per unique set of props — the compiler generates the cache key
export async function ProductCard({ id }: { id: string }) {
  "use cache";
  const product = await getProduct(id);
  return <Card>{product.name}</Card>;
}
```

### A function

```ts
export async function getExchangeRates() {
  "use cache";
  const res = await fetch("https://api.example.com/rates");
  return res.json();
}
```

Cache keys are generated **automatically from the arguments and closed-over values** — no manual key management.

## 3.3 Controlling lifetime with `cacheLife`

```ts
import { cacheLife } from "next/cache"; // stable (unprefixed) since Next.js 16.x

export async function getWeather(city: string) {
  "use cache";
  cacheLife("minutes"); // built-in profiles: seconds | minutes | hours | days | weeks | max
  return fetchWeather(city);
}
```

Define custom profiles in `next.config.ts` when the presets don't fit:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    catalog: { stale: 300, revalidate: 3600, expire: 86400 },
  },
};
// then: cacheLife("catalog")
```

Rule of thumb: pick the **longest lifetime you can tolerate**, then rely on tags (below) to invalidate the moment data actually changes.

## 3.4 Targeted invalidation with `cacheTag` + `updateTag`/`revalidateTag`

```ts
import { cacheTag } from "next/cache";

export async function getProduct(id: string) {
  "use cache";
  cacheTag(`product-${id}`);
  return db.product.findUnique({ where: { id } });
}
```

```ts
// features/products/actions.ts
"use server";
import { updateTag } from "next/cache";

export async function updateProduct(id: string, data: ProductInput) {
  await db.product.update({ where: { id }, data });
  updateTag(`product-${id}`); // every cached page/component using this tag refreshes
}
```

Next.js 16 splits invalidation into two APIs — pick by *where you're calling from*:

- **`updateTag(tag)`** — Server Actions only. Expires the tag **and** refreshes it within the same request, so the user immediately sees their own write (the create-then-redirect flow).
- **`revalidateTag(tag, profile)`** — Route Handlers, webhooks, background jobs. Marks the tag stale; the second argument (a `cacheLife` profile such as `"max"`, required since 16.2) controls how the entry is served while revalidating.

Tag by **entity** (`product-42`), and optionally by **collection** (`products`) so list pages can be invalidated with one call. This beats time-based revalidation in almost every case: content is never stale, and never rebuilt without cause.

## 3.5 Partial Pre-Rendering: static shell + dynamic holes

Cache Components make PPR the default rendering model. One page can mix both worlds:

```tsx
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetails params={params} />   {/* "use cache" inside → prerendered, served from CDN */}
      </Suspense>
      <Suspense fallback={<PriceSkeleton />}>
        <PersonalizedPrice params={params} /> {/* reads cookies → streams in per-request */}
      </Suspense>
    </>
  );
}
```

The user gets the cached shell **immediately** (CDN-fast), and only the personalized hole costs server time.

### Runtime APIs mark subtrees dynamic

`cookies()`, `headers()`, `searchParams`, and `connection()` make the surrounding component per-request. With Cache Components enabled, dynamic subtrees must sit **below a `<Suspense>` boundary** (or the route errors at build time — a feature, not a bug: it forces you to decide what's static).

## 3.6 The client-side cache: `staleTimes` and `<Link>`

Navigations reuse a client-side Router Cache. Defaults are conservative (dynamic content re-fetches); tune with:

```ts
const nextConfig: NextConfig = {
  experimental: { staleTimes: { dynamic: 30, static: 180 } },
};
```

Keep `<Link>` prefetching enabled — combined with PPR, prefetched static shells make navigations feel instant.

## 3.7 Migration cheat-sheet (Next.js 14/15 → 16)

| Old pattern | New pattern |
| --- | --- |
| `export const revalidate = 3600` | `"use cache"` + `cacheLife("hours")` |
| `fetch(url, { next: { revalidate: 60 } })` | `"use cache"` + `cacheLife()` in the calling function |
| `fetch(url, { next: { tags: ["x"] } })` | `"use cache"` + `cacheTag("x")` |
| `unstable_cache(fn, keys, opts)` | `"use cache"` on the function |
| `export const dynamic = "force-static"` | `"use cache"` on the page |
| `export const dynamic = "force-dynamic"` | Do nothing — dynamic is the default |

## Best practices

1. **Cache data, not requests.** Put `"use cache"` on query functions in `features/*/queries.ts` so every caller benefits.
2. **Never cache personalized data** — anything derived from `cookies()`/`headers()` stays dynamic. Cache the shell around it.
3. **Tag everything you cache.** An untagged cache entry can only expire by time.
4. **Invalidate from Server Actions**, right after the write — the UI updates on the next render with zero staleness window.
5. **Don't cache secrets in closures.** Closed-over values become part of the cache key/entry; keep credentials inside the function via env vars.

---

**Next:** [4. Turbopack →](04-turbopack.md)
