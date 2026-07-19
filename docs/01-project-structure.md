# 1. Project Structure Best Practices

The App Router gives you file-system routing, but it does **not** tell you where the rest of your code should live. This chapter shows a structure that scales from a side project to a large team codebase.

## The core idea: routes are thin, features are fat

`app/` should contain **routing concerns only** — pages, layouts, loading/error states, route handlers. Business logic, UI components, and data access live outside it, organized **by feature**.

```
.
├── app/                        # Routing only
│   ├── layout.tsx              # Root layout (html/body, providers)
│   ├── page.tsx                # /
│   ├── globals.css
│   ├── (marketing)/            # Route group — no URL segment
│   │   ├── layout.tsx          # Marketing-specific layout
│   │   ├── about/page.tsx      # /about
│   │   └── pricing/page.tsx    # /pricing
│   ├── (app)/                  # Authenticated app shell
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # /dashboard
│   │   │   ├── loading.tsx     # Streaming fallback
│   │   │   └── error.tsx       # Error boundary
│   │   └── orders/
│   │       ├── page.tsx        # /orders
│   │       └── [id]/page.tsx   # /orders/:id
│   └── api/
│       └── webhooks/route.ts   # Route handlers (external consumers only)
│
├── features/                   # Feature modules (the real code)
│   ├── orders/
│   │   ├── components/         # OrderTable.tsx, OrderStatusBadge.tsx
│   │   ├── actions.ts          # Server Actions ("use server")
│   │   ├── queries.ts          # Data access ("server-only")
│   │   └── types.ts
│   └── auth/
│       ├── components/
│       └── session.ts
│
├── components/                 # Shared, feature-agnostic UI
│   └── ui/                     # Button, Card, Dialog…
├── lib/                        # Cross-cutting utilities (db client, fetcher, cn)
├── proxy.ts                    # Network boundary (was middleware.ts before v16)
└── next.config.ts
```

### Why this works

- **Route files stay readable.** A `page.tsx` should mostly compose feature components and pass data down. If a page file is 300 lines, code is in the wrong place.
- **Features are deletable.** Everything about "orders" lives in one folder. Removing or refactoring a feature doesn't require a repo-wide hunt.
- **The server/client boundary is explicit.** `queries.ts` imports `server-only`; `actions.ts` starts with `"use server"`. It's impossible to accidentally ship database code to the browser.

## Key conventions

### 1. Use route groups `(name)` to separate layouts, not URLs

Route groups organize sections with different shells (marketing vs. authenticated app) without affecting the URL. Don't use them as a general folder system — only when a group genuinely needs its own layout or organization.

### 2. Colocate private files with an underscore or keep them out of `app/`

Any folder in `app/` not named `page`/`route` etc. is already unrouted, but `_components/` makes intent explicit if you prefer colocating small route-specific pieces:

```
app/dashboard/
├── page.tsx
└── _components/RevenueChart.tsx   # Only used by this route
```

Rule of thumb: used by **one route** → colocate; used by **one feature across routes** → `features/<name>/components`; used **everywhere** → `components/ui`.

### 3. Guard the server/client boundary with packages, not discipline

```ts
// features/orders/queries.ts
import "server-only"; // build error if a Client Component imports this

export async function getOrders(userId: string) {
  return db.order.findMany({ where: { userId } });
}
```

Install [`server-only`](https://www.npmjs.com/package/server-only) and add it to every file that touches secrets, the database, or internal APIs.

### 4. Put `"use client"` at the leaves

A `"use client"` directive marks the *entry point* of a client bundle — everything it imports becomes client code too. Mark the small interactive leaf (a button, a form, a chart), never a layout or page, unless the whole subtree truly needs interactivity. See [Chapter 2](02-ssr-performance.md) for the performance impact.

### 5. Server Actions live next to their feature

```ts
// features/orders/actions.ts
"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

const CancelOrder = z.object({ orderId: z.string().uuid() });

export async function cancelOrder(formData: FormData) {
  const { orderId } = CancelOrder.parse(Object.fromEntries(formData));
  await db.order.update({ where: { id: orderId }, data: { status: "cancelled" } });
  updateTag(`order-${orderId}`);
}
```

Treat every Server Action as a **public HTTP endpoint**: validate input, check authentication *inside* the action, never trust the caller.

### 6. Route Handlers (`app/api`) are for external consumers

Your own React components should call data functions directly (Server Components) or use Server Actions (mutations). Reserve `route.ts` for webhooks, mobile clients, and third-party integrations. Calling your own API route from a Server Component is a self-inflicted network hop.

### 7. Use TypeScript path aliases

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

`import { OrderTable } from "@/features/orders/components/OrderTable"` — no `../../..` archaeology.

## Anti-patterns to avoid

| Anti-pattern | Why it hurts | Do instead |
| --- | --- | --- |
| One giant `components/` folder with 200 files | No ownership, everything imports everything | Feature modules |
| `"use client"` in the root layout | Entire app becomes client-rendered | Client leaves only |
| Fetching from your own `/api` route in a page | Extra network hop, lost type safety | Call the query function directly |
| Business logic inside `page.tsx` | Untestable, unshareable | Move to `features/*/queries.ts` |
| Deeply mirroring routes in `features/` | Routes change; features don't | Name features by domain, not URL |

---

**Next:** [2. Server-Side Rendering Performance →](02-ssr-performance.md)
