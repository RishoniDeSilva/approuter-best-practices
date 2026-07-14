import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CartStatus } from "@/features/cart/components/CartStatus";
import { AddToCartButton } from "@/features/products/components/AddToCartButton";
import { getProduct, getProducts } from "@/features/products/queries";

// Partial Pre-Rendering demo (Chapter 3): the product details come from a
// cached query and are prerendered per path; CartStatus reads cookies, so
// it is dynamic and streams into its Suspense hole on every request.

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ id: product.id }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // params is a Promise in Next.js 15+
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>
        <strong>${product.price}</strong>
      </p>
      <AddToCartButton productId={product.id} />

      <Suspense fallback={<div className="skeleton" style={{ height: 48, marginTop: 16 }} />}>
        <CartStatus />
      </Suspense>
    </article>
  );
}
