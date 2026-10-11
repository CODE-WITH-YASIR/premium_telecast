"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/States";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for diagnostics — never shown to the user as a raw stack trace.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <ErrorState
        title="Something went wrong"
        description="An unexpected error occurred. You can try again."
        action={{ label: "Try again", onClick: reset }}
      />
    </div>
  );
}
