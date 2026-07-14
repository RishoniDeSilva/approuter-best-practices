"use server";

import { cookies } from "next/headers";

// Server Actions live next to their feature (Chapter 1).
// Treat every action like a public endpoint: validate input first.

export async function addToCart(productId: string) {
  if (typeof productId !== "string" || productId.length === 0) {
    throw new Error("Invalid product id");
  }

  const cookieStore = await cookies();
  const count = Number(cookieStore.get("cart-count")?.value ?? 0);
  cookieStore.set("cart-count", String(count + 1));
}
