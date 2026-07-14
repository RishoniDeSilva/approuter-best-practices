import "server-only";
import { dbGetRecentOrders, dbGetStats } from "@/lib/db";

// Deliberately NOT cached: the dashboard demonstrates streaming dynamic
// data with <Suspense> (Chapter 2). Compare with products/queries.ts.

export async function getStats() {
  return dbGetStats();
}

export async function getRecentOrders() {
  return dbGetRecentOrders();
}
