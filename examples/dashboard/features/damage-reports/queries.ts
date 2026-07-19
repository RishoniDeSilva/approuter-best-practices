import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { dbGetDamageReport, dbGetDamageReports } from "@/lib/db";

export async function getDamageReports() {
  "use cache";
  cacheTag("damage-reports");
  cacheLife("hours");
  return dbGetDamageReports();
}

export async function getDamageReport(id: string) {
  "use cache";
  // Thrown errors are never cached, but a successful `undefined` (unknown id)
  // IS cached for the full lifetime. Safe here only because the shared
  // "damage-reports" tag invalidates the miss when a report is created.
  cacheTag("damage-reports", `damage-report-${id}`);
  cacheLife("hours");
  return dbGetDamageReport(id);
}
