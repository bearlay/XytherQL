"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { auditMutation, auditTable, type AuditResult } from "@/lib/api";
import { useSession } from "@/lib/session-context";

type AuditPanelProps = {
  name: string;
  type: "table" | "mutation";
};

export function AuditPanel({ name, type }: AuditPanelProps) {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function runAudit() {
    if (!session) return;
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res =
        type === "table"
          ? await auditTable(session.session_id, name)
          : await auditMutation(session.session_id, name);
      setResult(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Access Control Test</CardTitle>
        <CardDescription>
          {type === "table"
            ? "Attempts a limited scalar read (max 3 rows)."
            : "Dispatches a safe validation mutation with fallback arguments."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runAudit}
          disabled={loading || !session}
          size="sm"
          className="h-10 w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run audit on &quot;{name}&quot;
        </Button>

        {err && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {err}
          </p>
        )}

        {result && (
          <div className="space-y-3 animate-slide-up">
            <StatusBadge status={result.status} />
            <p className="text-sm text-muted-foreground">{result.message}</p>
            {(result.query || result.mutation) && (
              <pre className="overflow-x-auto rounded-lg border border-white/5 bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-[#00F0FF]/90 sm:text-xs">
                {result.query || result.mutation}
              </pre>
            )}
            {result.records && result.records.length > 0 && (
              <pre className="max-h-48 overflow-auto rounded-lg border border-red-500/30 bg-red-500/5 p-3 font-mono text-[11px] sm:max-h-64 sm:text-xs">
                {JSON.stringify(result.records, null, 2)}
              </pre>
            )}
            {result.data && (
              <pre className="max-h-64 overflow-auto rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 font-mono text-xs">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
