// Mock in-memory "database" with artificial latency so streaming
// and caching behavior is visible in the demo.

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export type Order = {
  id: string;
  product: string;
  total: number;
  status: "paid" | "shipped" | "cancelled";
};

const products: Product[] = [
  { id: "1", name: "Mechanical Keyboard", description: "Tactile switches, hot-swappable.", price: 129 },
  { id: "2", name: "4K Monitor", description: "27-inch IPS panel, 144Hz.", price: 449 },
  { id: "3", name: "Ergonomic Chair", description: "Lumbar support, breathable mesh.", price: 389 },
];

const orders: Order[] = [
  { id: "a1", product: "Mechanical Keyboard", total: 129, status: "shipped" },
  { id: "a2", product: "4K Monitor", total: 449, status: "paid" },
  { id: "a3", product: "Ergonomic Chair", total: 389, status: "cancelled" },
];

export type Severity = "minor" | "moderate" | "severe";

export type DamageReport = {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  createdAt: string;
};

const damageReports: DamageReport[] = [
  {
    id: "d1",
    title: "Cracked monitor panel",
    severity: "severe",
    description: "Screen arrived with a diagonal crack across the top-left corner.",
    createdAt: "2026-07-10T09:30:00.000Z",
  },
  {
    id: "d2",
    title: "Scratched chair armrest",
    severity: "minor",
    description: "Light scratches on the right armrest, purely cosmetic.",
    createdAt: "2026-07-12T14:05:00.000Z",
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function dbGetProducts(): Promise<Product[]> {
  await sleep(300);
  return products;
}

export async function dbGetProduct(id: string): Promise<Product | undefined> {
  await sleep(300);
  return products.find((p) => p.id === id);
}

export async function dbGetStats() {
  await sleep(200); // fast query
  return { revenue: 96700, orders: 214, customers: 87 };
}

export async function dbGetRecentOrders(): Promise<Order[]> {
  await sleep(1500); // deliberately slow — watch it stream in
  return orders;
}

export async function dbGetConversionRate(): Promise<number> {
  await sleep(600);
  // Deliberately flaky — demonstrates section-level error boundaries + retry.
  if (Math.random() < 0.5) throw new Error("Analytics service timed out");
  return 3.7;
}

export async function dbGetDamageReports(): Promise<DamageReport[]> {
  await sleep(300);
  return [...damageReports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function dbGetDamageReport(id: string): Promise<DamageReport | undefined> {
  await sleep(300);
  return damageReports.find((report) => report.id === id);
}

export async function dbCreateDamageReport(
  input: Omit<DamageReport, "id" | "createdAt">,
): Promise<DamageReport> {
  await sleep(300);
  // Deliberate crash trigger — type "boom" in the title to see an
  // unexpected error reach the app-wide error boundary.
  if (input.title.toLowerCase().includes("boom")) {
    throw new Error("Database write failed (simulated)");
  }
  const report: DamageReport = {
    ...input,
    id: `d${damageReports.length + 1}-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  damageReports.push(report);
  return report;
}
