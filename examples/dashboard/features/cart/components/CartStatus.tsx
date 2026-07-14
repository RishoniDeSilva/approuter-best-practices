import { cookies } from "next/headers";

// Reads cookies → this component is dynamic (per-request). It must render
// below a <Suspense> boundary; the cached shell around it is served from
// the CDN while this streams in (Partial Pre-Rendering, Chapter 3).

export async function CartStatus() {
  const cookieStore = await cookies();
  const count = Number(cookieStore.get("cart-count")?.value ?? 0);

  return (
    <p className="cart-status">
      🛒 {count} item{count === 1 ? "" : "s"} in your cart (personalized — rendered per request)
    </p>
  );
}
