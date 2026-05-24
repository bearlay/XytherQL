"use client";

import { useState } from "react";
import { Database, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { dumpTable, type DumpResult } from "@/lib/api";
import { useSession } from "@/lib/session-context";

type RetrieveDumpPanelProps = {
  tableName: string;
};

export function RetrieveDumpPanel({ tableName }: RetrieveDumpPanelProps) {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetchAll, setFetchAll] = useState(true);
  const [maxRows, setMaxRows] = useState("10000");
  const [batchSize, setBatchSize] = useState("500");
  const [result, setResult] = useState<DumpResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function runDump() {
    if (!session) return;
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await dumpTable(session.session_id, tableName, {
        fetch_all: fetchAll,
        max_rows: fetchAll ? 0 : parseInt(maxRows, 10) || 10000,
        batch_size: parseInt(batchSize, 10) || 500,
      });
      setResult(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Dump failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadJson() {
    if (!result?.records?.length) return;
    const blob = new Blob([JSON.stringify(result.records, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableName}_dump_${result.total_count}_rows.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="border-violet-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4 text-violet-400" />
          Retrieve Dump
        </CardTitle>
        <CardDescription>
          Paginated full-table extraction. Fetches all rows from the database
          (limit/offset batches) and lets you download JSON. Authorized testing
          only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
          <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={fetchAll}
              onChange={(e) => setFetchAll(e.target.checked)}
              className="rounded border-border accent-cyan-400"
            />
            Fetch all rows (until empty)
          </label>
          {!fetchAll && (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Max rows</p>
              <Input
                type="number"
                min={1}
                max={1000000}
                value={maxRows}
                onChange={(e) => setMaxRows(e.target.value)}
                className="w-full font-sans sm:w-32"
              />
            </div>
          )}
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Batch size</p>
            <Input
              type="number"
              min={1}
              max={5000}
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
              className="w-full font-sans sm:w-28"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            onClick={runDump}
            disabled={loading || !session}
            size="sm"
            className="h-10 w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {loading ? "Dumping…" : `Dump "${tableName}"`}
          </Button>
          {result?.records && result.records.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadJson}
              className="h-10 w-full sm:w-auto"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="truncate">
                Download JSON ({result.total_count} rows)
              </span>
            </Button>
          )}
        </div>

        {err && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {err}
          </p>
        )}

        {result && (
          <div className="space-y-3 animate-slide-up">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={result.status} />
              {result.truncated && (
                <span className="text-xs text-amber-400">
                  Truncated at safety cap — increase max rows or use smaller
                  batches.
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{result.message}</p>
            {result.pages_fetched != null && (
              <p className="text-xs text-muted-foreground">
                Pages fetched: {result.pages_fetched} · Total rows:{" "}
                {result.total_count}
              </p>
            )}
            {result.queries && result.queries.length > 0 && (
              <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs text-violet-300/90">
                {Array.isArray(result.queries)
                  ? result.queries.join("\n")
                  : result.queries}
              </pre>
            )}
            {result.records && result.records.length > 0 && (
              <pre className="max-h-96 overflow-auto rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 font-mono text-xs">
                {JSON.stringify(result.records.slice(0, 50), null, 2)}
                {result.records.length > 50 &&
                  `\n\n… and ${result.records.length - 50} more row(s). Use Download JSON for the full dump.`}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
