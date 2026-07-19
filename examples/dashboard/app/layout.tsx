import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Router Best Practices — Example",
  description: "Runnable demo of the patterns from the guide",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard (streaming)</Link>
          <Link href="/products">Products (caching + PPR)</Link>
          <Link href="/reports">Damage reports (errors + forms)</Link>
        </nav>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
