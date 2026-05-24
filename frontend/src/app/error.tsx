"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-xl font-semibold">Application error</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {error.message || "A client-side error occurred."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            try {
              sessionStorage.removeItem("xytherql-session");
            } catch {
              /* ignore */
            }
            window.location.href = "/";
          }}
        >
          Clear session &amp; home
        </Button>
      </div>
    </div>
  );
}
