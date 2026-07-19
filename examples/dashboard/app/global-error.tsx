"use client";

// Last-resort boundary (Chapter 6.5): catches root layout errors and
// replaces the whole document, so it must render <html> and <body> and
// stay dependency-free (inline styles only — globals.css is gone here).

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 2rem", textAlign: "center" }}>
        <h1>Something went badly wrong.</h1>
        {error.digest && <p>Error reference: {error.digest}</p>}
        <button
          // Hard reload, not reset(): with the root layout gone there is no
          // healthy tree to retry into — start over from the server.
          onClick={() => window.location.reload()}
          style={{ padding: "0.5rem 1rem", borderRadius: 6, cursor: "pointer" }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
