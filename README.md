# Next.js App Router Best Practices

A practical, opinionated guide to building fast, maintainable applications with the **Next.js App Router** — updated for **Next.js 16**.

> Covers server-side rendering performance, the new caching model (Cache Components / `use cache`), Turbopack, and how to structure a real-world React/Next.js project.

## 📚 Table of Contents

| Chapter | What you'll learn |
| --- | --- |
| [1. Project Structure](docs/01-project-structure.md) | How to organize an App Router project that scales — folder conventions, colocation, feature modules |
| [2. Server-Side Rendering Performance](docs/02-ssr-performance.md) | Server Components, streaming, `Suspense`, avoiding waterfalls, minimizing client JavaScript |
| [3. Caching & Cache Components](docs/03-caching-and-cache-components.md) | The Next.js 16 opt-in caching model: `use cache`, `cacheLife`, `cacheTag`, and Partial Pre-Rendering |
| [4. Turbopack](docs/04-turbopack.md) | The now-default Rust bundler: what changed, filesystem caching, migration notes |
| [5. What's New in Next.js 16](docs/05-nextjs-16-features.md) | Cache Components, `proxy.ts`, React Compiler, DevTools MCP, breaking changes |
| [6. Error Handling](docs/06-error-handling.md) | Consistent error handling: `error.tsx`, retry/reset done right, form errors with `useActionState`, `not-found`, `onRequestError` |

## 🧪 Example Project

Every pattern in the guide is demonstrated in a runnable Next.js 16 app: **[examples/dashboard](examples/dashboard)**.

```bash
cd examples/dashboard
npm install
npm run dev
```

It shows streaming with `<Suspense>`, `"use cache"` + `cacheTag`/`cacheLife` + `updateTag`, Partial Pre-Rendering, Server Actions, feature-module structure, `proxy.ts`, and layered error handling — with an in-memory mock database, so there's nothing to set up.

Every failure mode is **replicable interactively**, via a damage-reports CRUD domain (list → details → create) and built-in triggers:

- 💥 **Crash buttons** on the home page and dashboard walk the error-boundary ladder: the same client crash is caught by the page-level `error.tsx` on `/dashboard`, and bubbles to the app-wide boundary from `/`.
- A **deliberately flaky dashboard widget** (~50% failure) degrades to a Retry card behind its own section boundary while the rest of the page stays alive.
- The **create-report form** returns field-level validation errors as values — with the user's input preserved against React 19's post-action form reset (including the `<select>`, which needs a `key` remount).
- Typing **"boom"** in a report title throws a simulated DB failure: the app-wide boundary shows a digest that correlates with the structured `onRequestError` log in your terminal.
- `/reports/does-not-exist` renders the segment's contextual `not-found.tsx` with a 404.

The full walkthrough is in the [example's README](examples/dashboard/README.md).

## Who is this for?

- Developers migrating from the Pages Router or from Next.js 13–15 to Next.js 16
- Teams standardizing App Router conventions across projects
- Anyone who wants their Next.js app to ship less JavaScript and render faster

## Quick Principles (TL;DR)

1. **Server first.** Every component is a Server Component until it needs interactivity. Add `"use client"` at the leaves, not the root.
2. **Cache explicitly.** In Next.js 16 caching is opt-in. Use `"use cache"` where data is shareable, and dynamic rendering everywhere else.
3. **Stream, don't block.** Wrap slow data in `<Suspense>` so the shell renders instantly.
4. **Fetch in parallel.** Start promises early, `await` late. Waterfalls are the #1 SSR performance killer.
5. **Colocate by feature.** Route folders hold routing files; real code lives in feature modules.
6. **Trust the defaults.** Turbopack, React Compiler, and the App Router defaults are tuned for you — reach for config only when you measure a problem.
7. **Expected errors are values, unexpected errors are thrown.** Validation returns `FormState` from actions; crashes land in layered `error.tsx` boundaries whose retry buttons do `router.refresh()` + `reset()` — never `reset()` alone.

## Requirements

- Next.js **16+**
- React **19.2+**
- Node.js **20.9+** (Node 18 is no longer supported)

## Contributing

Found an outdated pattern or want to add a chapter? PRs welcome — please keep examples minimal and runnable.

## License

[MIT](LICENSE)
