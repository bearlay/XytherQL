"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Loader2, Network } from "lucide-react";
import { RequireConnection } from "@/components/require-connection";

const SchemaGraphPanel = dynamic(
  () =>
    import("@/components/schema-graph/schema-graph-panel").then(
      (m) => m.SchemaGraphPanel
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F0FF]" />
      </div>
    ),
  }
);

export default function ExplorerPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-2 flex shrink-0 flex-wrap items-end justify-between gap-2 border-b border-white/5 pb-2 sm:mb-3 sm:pb-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
            <Network className="h-5 w-5 text-[#00F0FF]" />
            Schema <span className="text-gradient">ER Diagram</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Search entities, focus neighborhoods, pan and zoom the full canvas.
          </p>
        </div>
        <Link
          href="/"
          className="text-xs text-muted-foreground underline-offset-2 hover:text-[#00F0FF] hover:underline"
        >
          Dashboard
        </Link>
      </header>

      <RequireConnection>
        <div className="flex min-h-0 flex-1 flex-col">
          <SchemaGraphPanel fullPage />
        </div>
      </RequireConnection>
    </div>
  );
}
