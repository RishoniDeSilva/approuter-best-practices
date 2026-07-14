import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { dbGetProduct, dbGetProducts } from "@/lib/db";

// Cache data at the query layer so every caller benefits (Chapter 3).
// Tag by collection AND by entity for targeted invalidation.

export async function getProducts() {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  return dbGetProducts();
}

export async function getProduct(id: string) {
  "use cache";
  cacheTag("products", `product-${id}`);
  cacheLife("hours");
  return dbGetProduct(id);
}
