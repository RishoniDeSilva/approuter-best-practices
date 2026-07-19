"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";

// Page-wise error boundary (Chapter 6.1). Catches anything thrown by
// /dashboard rendering. The layout above stays interactive.

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error); // report to your observability tool here
  }, [error]);

  return (
    <div role="alert" className="error-card">
      <h2>The dashboard failed to load.</h2>
      {error.digest && <p className="hint">Error reference: {error.digest}</p>}
      <button
        className="button"
        onClick={() =>
          startTransition(() => {
            router.refresh(); // re-fetch server data — reset() alone would replay the same error
            reset();
          })
        }
      >
        Try again
      </button>
    </div>
  );
}
