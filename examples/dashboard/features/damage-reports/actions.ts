"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { dbCreateDamageReport, type Severity } from "@/lib/db";
import type { FormState } from "./form-state";

const SEVERITIES: Severity[] = ["minor", "moderate", "severe"];

export type DamageReportFieldErrors = {
  title?: string;
  severity?: string;
  description?: string;
};

export async function createDamageReport(
  _prev: FormState<DamageReportFieldErrors>,
  formData: FormData,
): Promise<FormState<DamageReportFieldErrors>> {
  const title = String(formData.get("title") ?? "").trim();
  const severity = String(formData.get("severity") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  // Expected errors → returned as values, field by field (Chapter 6.3).
  // Always validate on the server; client-side validation is UX, not security.
  const fieldErrors: DamageReportFieldErrors = {};
  if (title.length < 4) fieldErrors.title = "Title must be at least 4 characters.";
  if (!SEVERITIES.includes(severity as Severity))
    fieldErrors.severity = "Choose a severity level.";
  if (description.length < 10)
    fieldErrors.description = "Describe the damage in at least 10 characters.";
  if (Object.keys(fieldErrors).length > 0) {
    // Echo the submitted values back so the form can preserve the user's input.
    return { status: "error", fieldErrors, values: { title, severity, description } };
  }

  // Unexpected errors below (e.g. a failed DB write) THROW and surface at
  // the nearest error boundary — try it by putting "boom" in the title.
  const report = await dbCreateDamageReport({
    title,
    severity: severity as Severity,
    description,
  });

  // updateTag (Next 16): expire the tag AND refresh within this request, so
  // the redirect below already sees the new report (read-your-own-writes).
  updateTag("damage-reports");
  redirect(`/reports/${report.id}`); // throws internally — keep outside try/catch
}
