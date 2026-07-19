import type { Severity } from "@/lib/db";

// Server Component — no interactivity, no "use client" needed.

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`badge badge-${severity}`}>{severity}</span>;
}
