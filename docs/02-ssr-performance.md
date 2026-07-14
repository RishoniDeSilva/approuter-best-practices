# 2. Server-Side Rendering Performance Optimization

SSR performance in the App Router comes down to four levers:

1. **Render on the server by default** — ship less JavaScript.
2. **Stream with Suspense** — never block the whole page on the slowest query.
3. **Parallelize data fetching** — kill waterfalls.
4. **Cache what's shareable** — covered in depth in [Chapter 3](03-caching-and-cache-components.md).

## 2.1 Server Components: ship less JavaScript

Every component in the App Router is a **React Server Component (RSC)** by default. Server Components:

- render on the server and send only HTML + a compact RSC payload,
- add **zero** JavaScript to the client bundle,
- can be `async` and access databases, file systems, and secrets directly.

```tsx
// app/(app)/dashboard/page.tsx — Server Component (no directive needed)
import { getRevenue } from "@/features/analytics/queries";
import { RevenueChart } from "@/features/analytics/components/RevenueChart";

export default async function DashboardPage() {
  const revenue = await getRevenue(); // direct DB call, no API hop
  return <RevenueChart data={revenue} />;
}
```

### Push `"use client"` to the leaves

Everything imported by a `"use client"` file becomes part of the client bundle. The single biggest bundle-size mistake is marking a page or layout as client because one button needs an `onClick`.

```tsx
// ❌ Bad: whole page becomes client JS, data fetching moves to useEffect
"use client";
export default function ProductPage() { /* ... */ }

// ✅ Good: server page composes a small client leaf
// app/products/[id]/page.tsx (server)
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;            // params is a Promise in Next.js 15+
  const product = await getProduct(id);
  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <AddToCartButton productId={product.id} />  {/* client leaf */}
    </article>
  );
}
```

```tsx
// features/cart/components/AddToCartButton.tsx
"use client";
export function AddToCartButton({ productId }: { productId: string }) {
  return <button onClick={() => addToCart(productId)}>Add to cart</button>;
}
```

### Pass Server Components *through* Client Components as children

A Client Component can't import a Server Component, but it can **render one passed as a prop**. Use this to keep heavy server-rendered content out of client bundles:

```tsx
// ✅ ThemeProvider is client, but children stay server-rendered
<ThemeProvider>
  <ServerRenderedPage />
</ThemeProvider>
```

## 2.2 Streaming and Suspense: render the shell instantly

Without streaming, the user waits for your **slowest** data source before seeing anything. With `<Suspense>`, Next.js flushes the static shell immediately and streams slow sections in as they resolve.

```tsx
// app/(app)/dashboard/page.tsx
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <>
      <h1>Dashboard</h1>                      {/* flushed immediately */}
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />                              {/* awaits fast query */}
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />                       {/* awaits slow query — streams in later */}
      </Suspense>
    </>
  );
}

async function Stats() {
  const stats = await getStats();       // 50ms
  return <StatCards data={stats} />;
}

async function RecentOrders() {
  const orders = await getRecentOrders(); // 800ms — no longer blocks the page
  return <OrderTable orders={orders} />;
}
```

Guidelines:

- Add `loading.tsx` for whole-route fallbacks; use `<Suspense>` for section-level granularity.
- Make fallbacks **layout-stable** (skeletons matching final dimensions) to avoid layout shift.
- Don't wrap everything — each boundary is a visual "pop-in". Wrap the slow, non-critical sections; render critical content (the product name, the article body) in the shell.

## 2.3 Kill waterfalls: fetch in parallel

An `await` before another fetch starts is a **sequential waterfall**. Two 300ms queries take 600ms instead of 300ms.

```tsx
// ❌ Waterfall: user → then orders (600ms total)
const user = await getUser(id);
const orders = await getOrders(id);

// ✅ Parallel: both start immediately (300ms total)
const [user, orders] = await Promise.all([getUser(id), getOrders(id)]);
```

For independent page sections, the best pattern is **start early, await inside Suspense**:

```tsx
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const userPromise = params.then(({ id }) => getUser(id));     // kicked off now
  const ordersPromise = params.then(({ id }) => getOrders(id)); // kicked off now

  return (
    <>
      <Suspense fallback={<UserSkeleton />}>
        <UserCard userPromise={userPromise} />
      </Suspense>
      <Suspense fallback={<OrdersSkeleton />}>
        <Orders ordersPromise={ordersPromise} />
      </Suspense>
    </>
  );
}
```

Client Components can unwrap these promises with React 19's `use()` hook.

### Deduplicate, don't prop-drill

`fetch` is automatically **request-deduplicated** per render pass, and you can memoize non-fetch data access with React `cache()`:

```ts
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  return db.user.findUnique({ where: { id: session.userId } });
});
```

Now `getCurrentUser()` can be called from the layout, the page, and three components — it runs **once per request**. This lets you fetch *where the data is used* instead of threading props through the tree.

## 2.4 Reduce what you render and ship

- **`next/image`** — automatic sizing, lazy loading, and modern formats. Always set `priority` on the LCP image.
- **`next/font`** — self-hosted fonts, zero layout shift, no external request.
- **`next/dynamic`** — lazy-load heavy client components that aren't visible at first paint (modals, editors, charts below the fold).

  ```tsx
  const Editor = dynamic(() => import("./RichTextEditor"), { ssr: false, loading: () => <EditorSkeleton /> });
  ```
- **Audit the bundle.** Run `next build` and read the route table: first-load JS per route should stay roughly under ~130 kB gzipped. Investigate anything that jumps.
- **React Compiler** (stable support in Next.js 16) auto-memoizes client components — enable it instead of hand-writing `useMemo`/`useCallback`:

  ```ts
  // next.config.ts
  const nextConfig = { reactCompiler: true };
  ```

## 2.5 Keep the request path fast

- **Colocate compute and data.** SSR time is dominated by data latency. Run your app in the same region as your database, or use a read replica near your functions.
- **Avoid `await` on non-critical work.** Analytics, logging, and cache writes can use `after()` (from `next/server`) to run after the response is sent.
- **Set `staleTimes`/prefetching wisely.** `<Link>` prefetches routes in the viewport by default — leave it on; it makes navigation feel instant.
- **Measure.** Use the Next.js DevTools overlay in development, and track TTFB / LCP / INP in production with `useReportWebVitals` or your APM.

## Checklist

- [ ] No `"use client"` in layouts or pages
- [ ] Slow sections wrapped in `<Suspense>` with layout-stable skeletons
- [ ] Independent fetches run via `Promise.all` or start-early/await-late
- [ ] Shared per-request data wrapped in React `cache()`
- [ ] LCP image uses `next/image` with `priority`
- [ ] Heavy client-only widgets loaded with `next/dynamic`
- [ ] React Compiler enabled
- [ ] First-load JS per route reviewed after `next build`

---

**Next:** [3. Caching & Cache Components →](03-caching-and-cache-components.md)
