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
