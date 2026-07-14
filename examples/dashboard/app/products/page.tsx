import Link from "next/link";
import { getProducts } from "@/features/products/queries";

// Fully cached page: getProducts() carries "use cache" + cacheTag("products"),
// so this renders once and is served statically until the tag is revalidated
// (Chapter 3). The 300ms mock DB latency is only paid at build/revalidation.

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <>
      <h1>Products</h1>
      <p>This list is cached — tagged <code>products</code>, lifetime <code>hours</code>.</p>
      <div className="card-grid">
        {products.map((product) => (
          <div key={product.id} className="card">
            <h3>
              <Link href={`/products/${product.id}`}>{product.name}</Link>
            </h3>
            <p>${product.price}</p>
          </div>
        ))}
      </div>
    </>
  );
}
