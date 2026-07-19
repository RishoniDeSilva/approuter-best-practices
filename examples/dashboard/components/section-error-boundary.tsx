"use client";

import { useRouter } from "next/navigation";
import { Component, startTransition, type ErrorInfo, type ReactNode } from "react";

// Section-level error boundary (Chapter 6.2): one flaky widget degrades to
// a small card with a Retry button instead of taking down the whole page.
// React has no hook for error boundaries, so a small class does the catching
// and a functional wrapper wires in router.refresh() for the retry.

type FallbackProps = { error: Error & { digest?: string }; retry: () => void };

type BoundaryProps = {
  fallback: (props: FallbackProps) => ReactNode;
  onRetry: () => void;
  children: ReactNode;
};

class Boundary extends Component<BoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Client-thrown errors never reach onRequestError — report them here.
    console.error(error, info.componentStack);
  }

  retry = () => {
    // Both in ONE transition: refresh re-fetches server data, and the state
    // update clears the boundary only once the new payload streams in.
    // A sync setState outside the transition would replay the old errored
    // payload — the exact mistake Chapter 6.1 warns about.
    startTransition(() => {
      this.props.onRetry();
      this.setState({ error: null });
    });
  };

  render() {
    if (this.state.error) {
      return this.props.fallback({ error: this.state.error, retry: this.retry });
    }
    return this.props.children;
  }
}

export function SectionErrorBoundary({
  fallbackTitle,
  children,
}: {
  fallbackTitle: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <Boundary
      onRetry={() => router.refresh()}
      fallback={({ error, retry }) => (
        <div role="alert" className="error-card">
          <p>{fallbackTitle}</p>
          {error.digest && <p className="hint">Error reference: {error.digest}</p>}
          <button className="button" onClick={retry}>Retry</button>
        </div>
      )}
    >
      {children}
    </Boundary>
  );
}
