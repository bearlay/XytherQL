"use client";

import {
  Focus,
  Loader2,
  Maximize2,
  RefreshCw,
  Search,
  Waypoints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SchemaGraphDisplayOptions } from "@/lib/schema-graph/types";

type SchemaGraphToolbarProps = {
  search: string;
  onSearchChange: (v: string) => void;
  display: SchemaGraphDisplayOptions;
  onDisplayChange: (d: SchemaGraphDisplayOptions) => void;
  showAll: boolean;
  onShowAllChange: (v: boolean) => void;
  onRefresh: () => void;
  onFitView: () => void;
  onResetFocus: () => void;
  loading?: boolean;
  visibleCount: number;
  totalTypes: number;
  truncated: boolean;
  focusLabel?: string | null;
};

export function SchemaGraphToolbar({
  search,
  onSearchChange,
  display,
  onDisplayChange,
  showAll,
  onShowAllChange,
  onRefresh,
  onFitView,
  onResetFocus,
  loading,
  visibleCount,
  totalTypes,
  truncated,
  focusLabel,
}: SchemaGraphToolbarProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/5 bg-[#0d1224] px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full min-w-[180px] max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Find entity…"
            className="h-8 border-slate-700/80 bg-[#131a2e] pl-8 text-sm placeholder:text-slate-500"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 border-slate-700/80"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 border-slate-700/80"
          onClick={onFitView}
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Fit
        </Button>

        <Button
          type="button"
          variant={showAll ? "secondary" : "outline"}
          size="sm"
          className="h-8 shrink-0 border-slate-700/80"
          onClick={() => onShowAllChange(!showAll)}
        >
          <Waypoints className="h-3.5 w-3.5" />
          {showAll ? "Focused" : "Full graph"}
        </Button>

        {focusLabel && !showAll && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 text-xs text-slate-400"
            onClick={onResetFocus}
          >
            <Focus className="h-3.5 w-3.5" />
            Reset focus
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={display.skipRelay}
            onChange={(e) =>
              onDisplayChange({ ...display, skipRelay: e.target.checked })
            }
            className="accent-cyan-400"
          />
          Hide Relay
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={display.skipDeprecated}
            onChange={(e) =>
              onDisplayChange({
                ...display,
                skipDeprecated: e.target.checked,
              })
            }
            className="accent-cyan-400"
          />
          Hide deprecated
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={display.showLeafFields}
            onChange={(e) =>
              onDisplayChange({
                ...display,
                showLeafFields: e.target.checked,
              })
            }
            className="accent-cyan-400"
          />
          Scalars
        </label>
        <span className="text-[10px] text-slate-500">
          {visibleCount} entit{visibleCount === 1 ? "y" : "ies"}
          {truncated && ` · ${totalTypes} total`}
        </span>
      </div>
    </div>
  );
}
