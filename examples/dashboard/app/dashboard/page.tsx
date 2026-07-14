import { Suspense } from "react";
import { getRecentOrders, getStats } from "@/features/analytics/queries";

// Streaming demo (Chapter 2): the heading flushes immediately, Stats
// arrives after ~200ms, RecentOrders streams in after ~1.5s. Neither
// blocks the other — each section awaits inside its own boundary.

export default function DashboardPage() {
  return (
    <>
      <h1>Dashboard</h1>
      <p>Uncached, per-request data — each section streams in independently.</p>

      <Suspense fallback={<div className="skeleton" style={{ height: 96, marginTop: 16 }} />}>
        <Stats />
      </Suspense>

      <h2>Recent orders</h2>
      <Suspense fallback={<div className="skeleton" style={{ height: 160 }} />}>
        <RecentOrders />
      </Suspense>
    </>
  );
}

async function Stats() {
  const stats = await getStats();
  return (
    <div className="card-grid">
      <div className="card"><h3>${(stats.revenue / 1000).toFixed(1)}k</h3>Revenue</div>
      <div className="card"><h3>{stats.orders}</h3>Orders</div>
      <div className="card"><h3>{stats.customers}</h3>Customers</div>
    </div>
  );
}

async function RecentOrders() {
  const orders = await getRecentOrders(); // ~1.5s — does not block the page
  return (
    <table>
      <thead>
        <tr><th>Product</th><th>Total</th><th>Status</th></tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>{order.product}</td>
            <td>${order.total}</td>
            <td>{order.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
