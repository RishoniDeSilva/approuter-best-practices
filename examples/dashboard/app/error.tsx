"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";

// App-wide catch-all boundary (Chapter 6.5). Anything a nested error.tsx
// didn't catch lands here — e.g. the simulated DB failure when a damage
// report title contains "boom".

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="error-card">
      <h2>Something went wrong.</h2>
      <p>
        An unexpected error occurred. In production the message is redacted — the
        reference below correlates with the server-side log from onRequestError.
      </p>
      {error.digest && <p className="hint">Error reference: {error.digest}</p>}
      <button
        className="button"
        onClick={() =>
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
      >
        Try again
      </button>
    </div>
  );
}
