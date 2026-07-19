import Link from "next/link";
import { SeverityBadge } from "@/features/damage-reports/components/SeverityBadge";
import { getDamageReports } from "@/features/damage-reports/queries";

// Cached list (tag: "damage-reports") — creating a report calls
// updateTag, so this page updates the moment data actually changes.

export default async function ReportsPage() {
  const reports = await getDamageReports();

  return (
    <>
      <div className="page-header">
        <h1>Damage reports</h1>
        <Link className="button" href="/reports/new">New report</Link>
      </div>
      <div className="card-grid">
        {reports.map((report) => (
          <div key={report.id} className="card">
            <h3><Link href={`/reports/${report.id}`}>{report.title}</Link></h3>
            <SeverityBadge severity={report.severity} />
          </div>
        ))}
      </div>
    </>
  );
}
