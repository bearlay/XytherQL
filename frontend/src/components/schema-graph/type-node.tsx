"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { KeyRound, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TypeNodeData } from "@/lib/schema-graph/build-graph";

function TypeNodeComponent({ data, selected }: NodeProps) {
  const d = data as TypeNodeData;
  const isActive = selected || d.focused;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-[#131a2e] shadow-xl transition-all duration-200",
        isActive
          ? "border-[#00F0FF]/70 ring-2 ring-[#00F0FF]/25"
          : "border-slate-700/80 hover:border-slate-500/80",
        d.dimmed && "opacity-40"
      )}
      style={{ width: 248 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !-left-1 !border-slate-500 !bg-[#0B1020]"
      />

      <div
        className="flex items-center justify-between gap-2 px-3 py-2.5"
        style={{ backgroundColor: `${d.accent}18`, borderBottom: `1px solid ${d.accent}40` }}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[13px] text-white">
            {d.label}
          </p>
          <p
            className="mt-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{ color: d.accent }}
          >
            {d.kind.replace("_", " ")}
          </p>
        </div>
        {d.isRoot && (
          <span className="shrink-0 rounded border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[#00F0FF]">
            Root
          </span>
        )}
      </div>

      <ul className="divide-y divide-slate-800/80 px-0 py-0">
        {d.previewFields.map((f) => (
          <li
            key={f.name}
            className="flex items-center gap-2 px-3 py-1.5 text-[11px] leading-tight"
          >
            {f.isKey ? (
              <KeyRound className="h-3 w-3 shrink-0 text-amber-400/90" />
            ) : f.isRelation ? (
              <Link2 className="h-3 w-3 shrink-0 text-[#00F0FF]/80" />
            ) : (
              <span className="inline-block h-3 w-3 shrink-0" />
            )}
            <span
              className={cn(
                "min-w-0 flex-1 truncate font-mono",
                f.isRelation ? "text-[#7dd3fc]" : "text-slate-300"
              )}
            >
              {f.name}
            </span>
            <span className="max-w-[90px] truncate font-mono text-[10px] text-slate-500">
              {f.typeLabel}
            </span>
          </li>
        ))}
      </ul>

      {d.moreCount > 0 && (
        <p className="border-t border-slate-800/80 px-3 py-1.5 text-center text-[10px] text-slate-500">
          +{d.moreCount} more attribute{d.moreCount === 1 ? "" : "s"}
        </p>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !-right-1 !border-slate-500 !bg-[#0B1020]"
      />
    </div>
  );
}

export const TypeNode = memo(TypeNodeComponent);
