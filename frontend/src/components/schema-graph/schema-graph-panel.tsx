"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Network } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { getIntrospection, type IntrospectionResponse } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import type { SchemaGraphDisplayOptions } from "@/lib/schema-graph/types";

const SchemaGraphViewer = dynamic(
  () =>
    import("./schema-graph-viewer").then((m) => m.SchemaGraphViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-[#080c18]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
      </div>
    ),
  }
);

export function SchemaGraphPanel({ fullPage = false }: { fullPage?: boolean }) {
  const { session, connected } = useSession();
  const [data, setData] = useState<IntrospectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerKey, setViewerKey] = useState(0);
  const [display, setDisplay] = useState<SchemaGraphDisplayOptions>({
    skipRelay: true,
    skipDeprecated: false,
    showLeafFields: false,
    sortByAlphabet: true,
  });

  const load = useCallback(async () => {
    if (!session?.session_id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getIntrospection(session.session_id);
      setData(res);
      setViewerKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load schema");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [session?.session_id]);

  useEffect(() => {
    if (connected && session?.session_id) load();
  }, [connected, session?.session_id, load]);

  if (!connected) {
    return (
      <Card className="border-[#00F0FF]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Network className="h-5 w-5 text-[#00F0FF]" />
            Schema ER Diagram
          </CardTitle>
          <CardDescription>
            Explore entities and relationships in a clean diagram. Connect on
            the dashboard first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/">
            <Button type="button" className="w-full sm:w-auto">
              Connect on dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const graphHeight = fullPage
    ? "min-h-0 flex-1 basis-0"
    : "h-[min(80vh,900px)] min-h-[520px] shrink-0";

  return (
    <Card
      className={`flex flex-col overflow-hidden border-[#00F0FF]/15 p-0 ${fullPage ? "h-full min-h-0 flex-1 border-0 bg-transparent shadow-none" : ""}`}
    >
      {!fullPage && (
        <CardHeader className="border-b border-white/5 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Network className="h-5 w-5 text-[#00F0FF]" />
            Schema ER Diagram
          </CardTitle>
          <CardDescription>
            Entity-relationship view of your GraphQL schema. Search, focus, and
            inspect types.
          </CardDescription>
        </CardHeader>
      )}

      {error && (
        <p className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          {error.includes("Session not found") && (
            <>
              {" "}
              <Link href="/" className="underline">
                Reconnect
              </Link>
            </>
          )}
        </p>
      )}

      <CardContent
        className={`flex min-h-0 flex-col overflow-hidden p-0 ${graphHeight}`}
      >
        {data && !loading ? (
          <ErrorBoundary
            title="Schema diagram failed to render"
            onReset={() => setViewerKey((k) => k + 1)}
          >
            <div className="min-h-0 flex-1">
            <SchemaGraphViewer
              key={viewerKey}
              introspection={data}
              displayOptions={display}
              onDisplayChange={setDisplay}
              onRefresh={load}
              loading={loading}
            />
            </div>
          </ErrorBoundary>
        ) : (
          <div className="flex h-full items-center justify-center bg-[#080c18]">
            <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
