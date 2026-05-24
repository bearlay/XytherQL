"use client";

import Link from "next/link";
import { ConnectForm } from "@/components/connect-form";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session-context";

export function RequireConnection({ children }: { children: React.ReactNode }) {
  const { connected } = useSession();

  if (!connected) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Connect to a GraphQL endpoint from the{" "}
          <Link href="/" className="text-[#00F0FF] hover:underline">
            dashboard
          </Link>{" "}
          first.
        </p>
        <ConnectForm />
        <Link href="/">
          <Button variant="outline" size="sm" type="button">
            Back to dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
