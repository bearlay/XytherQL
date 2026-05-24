"use client";

import Link from "next/link";
import { ExternalLink, Focus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { kindAccent } from "@/lib/schema-graph/introspection-utils";
import type { GraphTypeInfo } from "@/lib/schema-graph/types";

type SchemaGraphDetailProps = {
  typeInfo: GraphTypeInfo | null;
  focusId?: string | null;
  onClose: () => void;
  onFocusType?: (name: string) => void;
};

export function SchemaGraphDetail({
  typeInfo,
  focusId,
  onClose,
  onFocusType,
}: SchemaGraphDetailProps) {
  if (!typeInfo) {
    return (
      <div className="flex h-full flex-col justify-center p-6">
        <div className="rounded-xl border border-dashed border-slate-700/80 bg-[#131a2e]/50 p-6 text-center">
          <p className="text-sm font-medium text-slate-300">Entity inspector</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Click an entity in the diagram to view attributes, relationships, and
            open a full audit.
          </p>
          {focusId && (
            <p className="mt-3 font-mono text-xs text-[#00F0FF]/80">
              Focused: {focusId}
            </p>
          )}
        </div>
      </div>
    );
  }

  const accent = kindAccent(typeInfo.kind);
  const relations = typeInfo.fields.filter(
    (f) => f.namedKind === "OBJECT" || f.namedKind === "INTERFACE" || f.namedKind === "UNION"
  );

  return (
    <div className="flex h-full flex-col bg-[#0d1224]">
      <div className="flex items-start justify-between gap-2 border-b border-white/5 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-base font-semibold text-white">
            {typeInfo.name}
          </p>
          <Badge variant="outline" className="mt-1.5 text-[10px]" style={{ color: accent }}>
            {typeInfo.kind}
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 shrink-0 p-0 text-slate-400"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {typeInfo.description && (
        <p className="border-b border-white/5 px-4 py-2.5 text-xs leading-relaxed text-slate-400">
          {typeInfo.description}
        </p>
      )}

      {relations.length > 0 && onFocusType && (
        <div className="border-b border-white/5 px-4 py-2.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Relationships
          </p>
          <div className="flex flex-wrap gap-1">
            {relations.slice(0, 12).map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => onFocusType(f.namedType)}
                className="rounded-md border border-[#00F0FF]/20 bg-[#00F0FF]/5 px-2 py-0.5 font-mono text-[10px] text-[#7dd3fc] transition-colors hover:bg-[#00F0FF]/15"
              >
                {f.name} → {f.namedType}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {typeInfo.fields.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-slate-500">
                <th className="pb-2 font-medium">Attribute</th>
                <th className="pb-2 font-medium">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {typeInfo.fields.map((f) => (
                <tr key={f.name} className="group">
                  <td className="py-1.5 pr-2 font-mono text-slate-200">
                    {f.name}
                    {f.isDeprecated && (
                      <span className="ml-1 text-amber-500/90">†</span>
                    )}
                  </td>
                  <td className="py-1.5 font-mono text-slate-500">{f.typeLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : typeInfo.enumValues ? (
          <ul className="space-y-1">
            {typeInfo.enumValues.map((v) => (
              <li
                key={v.name}
                className="rounded border border-slate-800/80 px-2 py-1 font-mono text-xs text-slate-300"
              >
                {v.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">No fields</p>
        )}
      </div>

      <div className="flex gap-2 border-t border-white/5 p-3">
        {onFocusType && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => onFocusType(typeInfo.name)}
          >
            <Focus className="h-3.5 w-3.5" />
            Focus
          </Button>
        )}
        <Link
          href={
            typeInfo.kind === "OBJECT"
              ? `/tables/${encodeURIComponent(typeInfo.name)}`
              : "/inspector"
          }
          className="flex-1"
        >
          <Button type="button" variant="outline" size="sm" className="w-full">
            <ExternalLink className="h-3.5 w-3.5" />
            Audit
          </Button>
        </Link>
      </div>
    </div>
  );
}
