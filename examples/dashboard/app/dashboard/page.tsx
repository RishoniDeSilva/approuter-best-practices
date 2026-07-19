import { Suspense } from "react";
import { CrashButton } from "@/components/crash-button";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
import { getConversionRate, getRecentOrders, getStats } from "@/features/analytics/queries";

// Streaming demo (Chapter 2): the heading flushes immediately, Stats
// arrives after ~200ms, RecentOrders streams in after ~1.5s. Neither
// blocks the other — each section awaits inside its own boundary.

export default function DashboardPage() {
  return (
    <>
      <h1>Dashboard</h1>
      <p>Uncached, per-request data — each section streams in independently.</p>
      <p className="hint">
        <CrashButton label="💥 Crash the dashboard" /> — thrown outside any section
        boundary, so app/dashboard/error.tsx takes over this page. “Try again” recovers.
      </p>

      <Suspense fallback={<div className="skeleton" style={{ height: 96, marginTop: 16 }} />}>
        <Stats />
      </Suspense>

      <h2>Conversion rate</h2>
      <p className="hint">
        This widget fails ~50% of the time on purpose — its own error boundary keeps the
        rest of the page alive. Hit Retry (or reload) until it succeeds.
      </p>
      <SectionErrorBoundary fallbackTitle="Conversion rate is unavailable right now.">
        <Suspense fallback={<div className="skeleton" style={{ height: 72 }} />}>
          <ConversionRate />
        </Suspense>
      </SectionErrorBoundary>

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

async function ConversionRate() {
  const rate = await getConversionRate(); // throws ~50% of the time
  return (
    <div className="card">
      <h3>{rate}%</h3>Visitors who purchased
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
