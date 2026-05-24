"use client";

import { useState } from "react";
import { Loader2, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/lib/session-context";

export function ConnectForm() {
  const { connect, loading, error } = useSession();
  const [endpoint, setEndpoint] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!endpoint.trim()) return;
    await connect(endpoint.trim());
  }

  return (
    <Card className="w-full max-w-2xl border-[#00F0FF]/25 glow-ring">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-5 w-5 shrink-0 text-[#00F0FF]" />
          Connect to GraphQL Endpoint
        </CardTitle>
        <CardDescription>
          Run introspection to map tables, mutations, and authorization
          surfaces. Use only on systems you are authorized to test.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="https://api.example.com/graphql"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            disabled={loading}
            className="h-11 text-base sm:text-sm"
          />
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={loading || !endpoint.trim()}
            className="h-11 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Introspecting…
              </>
            ) : (
              <>
                <Plug className="h-4 w-4" />
                Connect &amp; Map Schema
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
