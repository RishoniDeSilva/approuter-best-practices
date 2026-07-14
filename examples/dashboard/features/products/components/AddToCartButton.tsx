"use client";

import { useTransition } from "react";
import { addToCart } from "@/features/products/actions";

// The only Client Component on the product page — "use client" at the leaf
// (Chapter 2). Everything around it stays server-rendered.

export function AddToCartButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="button"
      disabled={isPending}
      onClick={() => startTransition(() => addToCart(productId))}
    >
      {isPending ? "Adding…" : "Add to cart"}
    </button>
  );
}
