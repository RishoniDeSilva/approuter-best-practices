# 6. Error Handling

Error handling in the App Router is layered. A consistent strategy needs an answer for **four kinds of failure**, each handled at a different level:

| Kind | Example | Mechanism |
| --- | --- | --- |
| **Expected errors** | Invalid form input, "out of stock", failed login | Return values (`useActionState`), never `throw` |
| **Route errors** (page-wise) | A page's data fetch fails | `error.tsx` segment boundary + retry |
| **Section errors** | One widget on a page fails | Component-level error boundary + retry |
| **Unexpected / catastrophic** | Bug in the root layout, unhandled crash | `app/error.tsx`, `global-error.tsx`, server-side reporting |

The core principle, and the one that future-proofs everything else:

> **Expected errors are *values*. Unexpected errors are *thrown* and caught by boundaries.**

If you throw for things you can predict (validation, auth, business rules), your UI logic ends up inside `catch` blocks and error boundaries where it doesn't belong — and React 19 + the App Router are explicitly designed around the value-based model.

## 6.1 Page-wise errors: `error.tsx`

Every route segment can define an `error.tsx` — a **Client Component** that wraps the segment in a React error boundary. When the page (or anything under it) throws during rendering, the boundary renders instead of crashing the app; layouts *above* it stay interactive.

```tsx
// app/dashboard/error.tsx
"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Report to your observability tool; `digest` matches the server log line
    console.error(error);
  }, [error]);

  return (
    <div role="alert">
      <h2>The dashboard failed to load.</h2>
      {error.digest && <p>Error reference: {error.digest}</p>}
      <button
        onClick={() =>
          startTransition(() => {
            router.refresh(); // re-fetch server data
            reset();          // re-render the boundary's children
          })
        }
      >
        Try again
      </button>
    </div>
  );
}
```

### The retry pattern that actually works

This is the most-copied-wrong snippet in the App Router. **`reset()` alone only re-renders the client tree** — if the error came from a Server Component's data fetch (the common case), re-rendering replays the same errored payload. The correct retry is both calls inside one transition:

```ts
startTransition(() => {
  router.refresh(); // ask the server to re-render the segment
  reset();          // clear the boundary once the new payload streams in
});
```

### What `error.tsx` catches — and doesn't

- ✅ Errors thrown in the segment's `page.tsx` and everything below it (server or client).
- ❌ Errors in the **same segment's `layout.tsx`** — those bubble to the *parent* segment's boundary. Put an `app/error.tsx` at the root as the app-wide catch-all.
- ❌ Errors in event handlers and async callbacks — boundaries only catch errors thrown **during render**. Handle those as values (Section 6.3). One useful exception: React 19 routes errors thrown inside Actions and `startTransition` callbacks to the nearest error boundary, so Server Action failures do land in `error.tsx`.
- In **production**, server error messages are redacted before reaching the client. You get a generic message plus `error.digest` — a hash you can grep for in server logs. Never build UI logic on `error.message` from the server; use typed results instead (Section 6.5).

## 6.2 Section errors: granular boundaries around widgets

An `error.tsx` takes down the whole page for one failed widget. For dashboards and composite pages, pair each independent section's `<Suspense>` boundary with its own error boundary, so one flaky data source degrades gracefully:

```tsx
<SectionErrorBoundary fallbackTitle="Conversion rate is unavailable.">
  <Suspense fallback={<Skeleton />}>
    <ConversionRate />   {/* may throw — only this card degrades */}
  </Suspense>
</SectionErrorBoundary>
```

React still ships no hook for error boundaries, so you need one class component (or the `react-error-boundary` package). A reusable, retry-capable version — a functional wrapper provides `router.refresh()`, the class provides the boundary:

```tsx
// components/section-error-boundary.tsx
"use client";

import { useRouter } from "next/navigation";
import { Component, startTransition, type ErrorInfo, type ReactNode } from "react";

type FallbackProps = { error: Error & { digest?: string }; retry: () => void };

class Boundary extends Component<
  { fallback: (props: FallbackProps) => ReactNode; onRetry: () => void; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Client-thrown errors never reach onRequestError — report them here.
    console.error(error, info.componentStack);
  }

  retry = () => {
    // Both in ONE transition — the same rule as 6.1. A sync setState outside
    // the transition re-renders against the old errored payload and can
    // leave the fallback stuck even after the data source recovers.
    startTransition(() => {
      this.props.onRetry();           // refresh server data
      this.setState({ error: null }); // clear once the new payload streams in
    });
  };

  render() {
    if (this.state.error) {
      return this.props.fallback({ error: this.state.error, retry: this.retry });
    }
    return this.props.children;
  }
}

export function SectionErrorBoundary({
  fallbackTitle,
  children,
}: {
  fallbackTitle: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <Boundary
      onRetry={() => router.refresh()}
      fallback={({ error, retry }) => (
        <div role="alert" className="error-card">
          <p>{fallbackTitle}</p>
          {error.digest && <p>Error reference: {error.digest}</p>}
          <button onClick={retry}>Retry</button>
        </div>
      )}
    >
      {children}
    </Boundary>
  );
}
```

Rule of thumb: **`error.tsx` per route, a section boundary per independent data source.** If a section failing shouldn't stop the user from using the rest of the page, it needs its own boundary.

## 6.3 Form-wise errors: Server Actions + `useActionState`

Validation failures are *expected*. They never throw — the action **returns a state object** that the form renders. This gives you field-level errors, preserved input, pending state, and progressive enhancement (the form works before JS loads).

Model the state as a discriminated union — this is the "consistent way": every form in the app uses the same shape.

```ts
// features/damage-reports/form-state.ts — shared by EVERY form in the app
// The error variant echoes the submitted values: React 19 resets uncontrolled
// fields when a form action completes — even on returned validation errors —
// so the form must re-apply them via defaultValue or the user's input is lost.
export type FormState<FieldErrors> =
  | { status: "idle" }
  | { status: "error"; fieldErrors: FieldErrors; formError?: string; values?: Record<string, string> }
  | { status: "success"; message: string };
```

```ts
// features/damage-reports/actions.ts
"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { dbCreateDamageReport } from "@/lib/db";
import type { FormState } from "./form-state";

export type DamageReportFieldErrors = { title?: string; severity?: string; description?: string };

export async function createDamageReport(
  _prev: FormState<DamageReportFieldErrors>,
  formData: FormData,
): Promise<FormState<DamageReportFieldErrors>> {
  const title = String(formData.get("title") ?? "").trim();
  const severity = String(formData.get("severity") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  // 1. Expected errors → returned, field by field, echoing the input
  const fieldErrors: DamageReportFieldErrors = {};
  if (title.length < 4) fieldErrors.title = "Title must be at least 4 characters.";
  if (!["minor", "moderate", "severe"].includes(severity))
    fieldErrors.severity = "Choose a severity level.";
  if (description.length < 10)
    fieldErrors.description = "Describe the damage in at least 10 characters.";
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors, values: { title, severity, description } };
  }

  // 2. Unexpected errors → thrown, caught by the nearest error boundary
  const report = await dbCreateDamageReport({ title, severity, description });

  updateTag("damage-reports");            // read-your-own-writes: cached list updates now
  redirect(`/reports/${report.id}`);      // throws internally — keep outside try/catch
}
```

```tsx
// features/damage-reports/components/DamageReportForm.tsx
"use client";

import { useActionState } from "react";
import { createDamageReport, type DamageReportFieldErrors } from "../actions";
import type { FormState } from "../form-state";

const initialState: FormState<DamageReportFieldErrors> = { status: "idle" };

export function DamageReportForm() {
  const [state, formAction, isPending] = useActionState(createDamageReport, initialState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};

  return (
    <form action={formAction}>
      <label htmlFor="title">Title</label>
      <input
        id="title"
        name="title"
        defaultValue={values.title}
        aria-invalid={!!fieldErrors.title}
        aria-describedby={fieldErrors.title ? "title-error" : undefined}
      />
      {fieldErrors.title && <p id="title-error">{fieldErrors.title}</p>}

      <label htmlFor="severity">Severity</label>
      <select
        id="severity"
        name="severity"
        key={values.severity ?? "unset"} // see note below — selects need a remount
        defaultValue={values.severity ?? ""}
        aria-invalid={!!fieldErrors.severity}
        aria-describedby={fieldErrors.severity ? "severity-error" : undefined}
      >
        <option value="" disabled>Select severity…</option>
        <option value="minor">Minor</option>
        <option value="moderate">Moderate</option>
        <option value="severe">Severe</option>
      </select>
      {fieldErrors.severity && <p id="severity-error">{fieldErrors.severity}</p>}

      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        name="description"
        defaultValue={values.description}
        aria-invalid={!!fieldErrors.description}
        aria-describedby={fieldErrors.description ? "description-error" : undefined}
      />
      {fieldErrors.description && <p id="description-error">{fieldErrors.description}</p>}

      <button disabled={isPending}>{isPending ? "Submitting…" : "Create report"}</button>
    </form>
  );
}
```

**Why the `values` echo matters:** when a form action completes, React 19 resets
uncontrolled inputs to their `defaultValue` — including when the action merely
*returned* a validation error. Without echoing the submitted values back through
state and into `defaultValue`, every failed submit silently wipes the user's
input. This is the single most common `useActionState` footgun.

**And the `<select>` sub-footgun:** for `input`/`textarea`, re-rendering with a
new `defaultValue` updates the DOM attribute, so the post-action reset restores
the echoed value. A `<select>`, however, only applies `defaultValue` **at
mount** — after the reset it snaps back to the placeholder even though the prop
changed. The `key={values.severity ?? "unset"}` forces a remount whenever the
echoed value changes, so the user's selection survives failed validation too.

> Need to pass extra arguments (an entity id, say) into an action used with
> `useActionState`? Bind them: `useActionState(action.bind(null, entityId), initialState)`.

Best practices that keep this future-proof:

- **Validate on the server always** (client-side validation is UX, not security). A schema library like Zod pairs well: `safeParse` → return `fieldErrors`; never `parse` → throw for bad input.
- **Return, don't throw, for anything the user can fix.** Throwing from an action surfaces the *redacted* production error page — the user loses their input and gets no guidance.
- **Keep one `FormState` shape for the whole app** so every form, toast, and test handles results identically.
- **Success paths:** either return `{ status: "success" }` for inline confirmation, or `redirect()` to the created resource (what the example does) — pick one per form, not both.
- **Accessibility:** `aria-invalid` on failed fields and `aria-describedby` pointing at each field's error message; `role="status"` on success text. Reserve `role="alert"` for a single form-level error — one alert per field triple-fires screen-reader announcements.

## 6.4 Not found, redirects, and other control flow

`notFound()` and `redirect()` throw special internal errors that Next.js handles — **never wrap them in try/catch that swallows errors**, and don't report them as failures:

```tsx
const product = await getProduct(id);
if (!product) notFound(); // renders the nearest not-found.tsx with a 404 status
```

- Add `app/not-found.tsx` for the global 404 and segment-level `not-found.tsx` where a nicer contextual message helps (e.g. "Product not found — browse the catalog").
- If you must catch broadly around code that may call these, re-throw what isn't yours, or check with `unstable_rethrow` from `next/navigation`.
- Next.js also ships `unauthorized()` / `forbidden()` with `unauthorized.tsx` / `forbidden.tsx` (behind the `authInterrupts` flag) — the same pattern extended to 401/403.

## 6.5 Unexpected errors: report once, on the server

### `app/error.tsx` and `global-error.tsx`

- `app/error.tsx` — the app-wide boundary; catches anything a nested boundary didn't.
- `app/global-error.tsx` — the last resort, catching **root layout** errors. It replaces the entire document, so it must render its own `<html>` and `<body>`, and shouldn't depend on anything that could itself fail (keep it inline-styled and dependency-free). Its retry button should do a hard `window.location.reload()` rather than the `reset()` pattern — with the root layout gone, there is no healthy tree to retry into.

### Centralized server-side reporting: `onRequestError`

Client-side `console.error` in boundaries is for debugging. The **single consistent reporting point** for all server errors — Server Components, Server Actions, Route Handlers — is the `onRequestError` hook:

```ts
// instrumentation.ts (project root)
import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  // Forward to Sentry/Datadog/OTel here. Include the digest so client
  // error screens ("Error reference: abc123") can be correlated.
  console.error(
    JSON.stringify({
      message: (error as Error).message,
      digest: (error as { digest?: string }).digest,
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,   // "App Router"
      routeType: context.routeType,     // "render" | "action" | "route" | ...
    }),
  );
};
```

This is where consistency pays off: one function sees every unexpected server error with route context, no per-page try/catch needed.

**What `onRequestError` does *not* see: client-side errors.** Hydration failures, Client Component render crashes, and event-handler errors never hit the server hook. Forward them from your boundaries (`useEffect` in `error.tsx`, `componentDidCatch` in section boundaries) or a browser SDK to your reporting endpoint — otherwise client-only crashes are invisible in production.

### Route Handlers: status codes, not boundaries

`error.tsx` plays no role in `app/api` routes — their consumers are HTTP clients. The same expected/unexpected split still applies:

- **Expected** failures return a JSON body with a 4xx status: `Response.json({ error: "Invalid payload" }, { status: 400 })`.
- **Unexpected** failures: let them throw. Next.js returns a 500 and `onRequestError` reports it. If you catch broadly (e.g. to shape the 500 body), you've taken over reporting — call your error tracker before returning.

## 6.6 Retry mechanisms beyond the button

- **User-initiated retry** — the `router.refresh()` + `reset()` pattern (6.1/6.2). Default for render-time failures.
- **Automatic retry with backoff** belongs in the **data layer**, not components, and only for *reads* (retrying a non-idempotent mutation double-charges someone):

  ```ts
  // lib/retry.ts
  export async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    for (let i = 0; ; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i >= attempts - 1) throw error;
        await new Promise((r) => setTimeout(r, 2 ** i * 200)); // 200ms, then 400ms
      }
    }
  }
  ```

- **Mutations:** make Server Actions idempotent where possible (upserts, idempotency keys) so a user double-clicking "Try again" is safe; `useActionState`'s `isPending` disables the button meanwhile.
- **Don't retry what won't heal:** validation and 4xx-class failures should fail fast to the value-based path; retries are for transient infrastructure errors.

## 6.7 Consistency checklist

- [ ] One `FormState` discriminated union shared by all forms/actions
- [ ] Expected errors returned as values; `throw` reserved for the unexpected
- [ ] `app/error.tsx` (app-wide) + per-route `error.tsx` where a contextual message helps
- [ ] `global-error.tsx` with inline styles and its own `<html>`/`<body>`
- [ ] Every retry button uses `startTransition(() => { router.refresh(); reset(); })`
- [ ] Independent widgets wrapped in section boundaries — one failure ≠ dead page
- [ ] `not-found.tsx` at root; `notFound()` for missing entities
- [ ] `onRequestError` in `instrumentation.ts` wired to your observability tool
- [ ] Automatic retries only in the data layer, only for idempotent reads
- [ ] No UI logic built on server `error.message` (redacted in production — use digests and typed results)
- [ ] `"use cache"` awareness: thrown errors are never cached, but returned "not found" results (`null`/`undefined`) **are** — tag them so writes invalidate the miss
- [ ] Client-side errors forwarded from boundaries to your reporting endpoint (`onRequestError` only sees server errors)

> All of this is runnable in the example app: retry the dashboard's flaky widget, submit an invalid damage report (watch your input survive), put "boom" in a report title, or visit a missing report. See [examples/dashboard](../examples/dashboard/README.md).

---

**Back to:** [README](../README.md)
