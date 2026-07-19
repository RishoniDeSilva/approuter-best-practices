import Link from "next/link";

// Global 404 for any unmatched URL (Chapter 6.4).

export default function NotFound() {
  return (
    <div className="error-card">
      <h1>Page not found</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link className="button" href="/">Go home</Link>
    </div>
  );
}
