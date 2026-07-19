import Link from "next/link";

// Segment-level 404 with a contextual message (Chapter 6.4).
// Try it: /reports/does-not-exist

export default function ReportNotFound() {
  return (
    <div className="error-card">
      <h1>Report not found</h1>
      <p>This damage report doesn&apos;t exist or was removed.</p>
      <Link className="button" href="/reports">Browse all reports</Link>
    </div>
  );
}
