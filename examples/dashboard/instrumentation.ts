import type { Instrumentation } from "next";

// The single consistent reporting point for ALL unexpected server errors —
// Server Components, Server Actions, Route Handlers (Chapter 6.5).
// Forward to Sentry/Datadog/OTel here; the digest correlates with the
// "Error reference" shown on client error screens.

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  console.error(
    "[server-error]",
    JSON.stringify({
      message: error instanceof Error ? error.message : String(error),
      digest: (error as { digest?: string }).digest,
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routeType: context.routeType,
    }),
  );
};
