import Link from "next/link";
import { notFound } from "next/navigation";
import { SeverityBadge } from "@/features/damage-reports/components/SeverityBadge";
import { getDamageReport, getDamageReports } from "@/features/damage-reports/queries";

export async function generateStaticParams() {
  const reports = await getDamageReports();
  return reports.map((report) => ({ id: report.id }));
}

export default async function ReportDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getDamageReport(id);
  if (!report) notFound(); // renders ./not-found.tsx with a 404 status

  return (
    <article>
      <Link href="/reports">← All reports</Link>
      <h1>{report.title}</h1>
      <p>
        <SeverityBadge severity={report.severity} /> · reported{" "}
        {new Date(report.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
      </p>
      <p>{report.description}</p>
    </article>
  );
}
