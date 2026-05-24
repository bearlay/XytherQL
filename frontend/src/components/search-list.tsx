"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchListProps = {
  items: string[];
  basePath: string;
  emptyMessage?: string;
  subtitle?: (item: string) => string;
};

export function SearchList({
  items,
  basePath,
  emptyMessage = "No items found.",
  subtitle,
}: SearchListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter((item) => item.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-11 pl-9 font-sans sm:h-10"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 glass">
          {filtered.map((item) => (
            <li key={item}>
              <Link
                href={`${basePath}/${encodeURIComponent(item)}`}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3.5 transition-colors sm:px-4",
                  "active:bg-primary/10 hover:bg-white/[0.03] group"
                )}
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-sm group-hover:text-[#00F0FF] transition-colors">
                    {item}
                  </span>
                  {subtitle && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {subtitle(item)}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[#00F0FF]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
