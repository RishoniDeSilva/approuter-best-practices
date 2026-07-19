import Link from "next/link";
import { CrashButton } from "@/components/crash-button";

// Static content, no data — prerendered at build time.

export default function HomePage() {
  return (
    <>
      <h1>App Router Best Practices — Example</h1>
      <p>
        This tiny app demonstrates the patterns from the guide. Run it with{" "}
        <code>npm run dev</code> and explore:
      </p>
      <ul>
        <li>
          <Link href="/dashboard">Dashboard</Link> — streaming with{" "}
          <code>&lt;Suspense&gt;</code>: the shell and stats render immediately, the slow
          orders table streams in ~1.5s later (Chapter 2).
        </li>
        <li>
          <Link href="/products">Products</Link> — <code>&quot;use cache&quot;</code> +{" "}
          <code>cacheTag</code>/<code>cacheLife</code> on the query layer, and Partial
          Pre-Rendering on the detail page: a cached shell with a personalized,
          cookie-reading cart status streamed per request (Chapter 3).
        </li>
      </ul>
      <p>
        Also on display: feature-module structure (<code>features/</code>), Server Actions,
        a client-leaf <code>AddToCartButton</code>, and <code>proxy.ts</code>.
      </p>
      <p className="hint">
        <CrashButton label="💥 Crash the app shell" /> — this route has no error.tsx of
        its own, so the error bubbles to the app-wide boundary in app/error.tsx.
      </p>
    </>
  );
}
