import { DamageReportForm } from "@/features/damage-reports/components/DamageReportForm";

export default function NewReportPage() {
  return (
    <>
      <h1>Create damage report</h1>
      <p>
        Expected errors (validation) are returned as values and rendered next to each
        field. Unexpected errors are thrown and caught by the app-wide error boundary.
      </p>
      <DamageReportForm />
    </>
  );
}
