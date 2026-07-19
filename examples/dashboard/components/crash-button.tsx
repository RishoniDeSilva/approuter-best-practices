"use client";

import { useState } from "react";

// Demo trigger: throws DURING RENDER (after the click sets state), which is
// what error boundaries catch. Throwing inside the onClick handler itself
// would NOT be caught — event handlers run outside render (Chapter 6.1).
// After the boundary's reset(), this remounts with fresh state and recovers.

export function CrashButton({ label = "💥 Crash this page" }: { label?: string }) {
  const [crashed, setCrashed] = useState(false);

  if (crashed) {
    throw new Error("Client render crash triggered by CrashButton (demo)");
  }

  return (
    <button className="button" onClick={() => setCrashed(true)}>
      {label}
    </button>
  );
}
