import { NextResponse, type NextRequest } from "next/server";

// proxy.ts replaces middleware.ts in Next.js 16 (Chapter 5).
// Keep it thin: routing concerns only — redirects, rewrites, headers.

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-demo", "app-router-best-practices");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
