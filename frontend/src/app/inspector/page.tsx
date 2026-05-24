"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { AuditPanel } from "@/components/audit-panel";
import { EntityFieldsTable } from "@/components/entity-fields-table";
import { PageHeader } from "@/components/page-header";
import { RequireConnection } from "@/components/require-connection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEntity, type EntityDetail } from "@/lib/api";
import { useSession } from "@/lib/session-context";

export default function InspectorPage() {
  const { session } = useSession();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allNames = useMemo(() => {
    if (!session) return [];
    const tables = session.tables.map((t) => ({ name: t, kind: "TABLE" }));
    const mutations = session.mutations.map((m) => ({
      name: m,
      kind: "MUTATION",
    }));
    return [...tables, ...mutations].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [session]);

  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allNames.slice(0, 12);
    return allNames.filter((n) => n.name.toLowerCase().includes(q)).slice(0, 12);
  }, [allNames, query]);

  async function inspect(name: string) {
    if (!session?.session_id || !name) return;
    setSelected(name);
    setLoading(true);
    setError(null);
    setEntity(null);
    try {
      const res = await getEntity(session.session_id, name);
      setEntity(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Not found");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selected) inspect(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.session_id]);

  const auditType =
    entity?.kind === "MUTATION"
      ? "mutation"
      : entity?.kind === "TABLE" || entity?.fields
        ? "table"
        : null;

  return (
    <>
      <PageHeader
        title="Schema Inspector"
        description="Search any table or mutation by name to view its structure and run an access audit."
      />
      <RequireConnection>
        <div className="space-y-6">
          <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 pl-9 font-sans sm:h-10"
                placeholder="Table or mutation name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) inspect(query.trim());
                }}
              />
            </div>
            <Button
              type="button"
              onClick={() => inspect(query.trim())}
              disabled={!query.trim()}
              className="h-11 w-full shrink-0 sm:h-10 sm:w-auto"
            >
              Inspect
            </Button>
          </div>

          {suggestions.length > 0 && !entity && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    setQuery(s.name);
                    inspect(s.name);
                  }}
                  className="rounded-full border border-border bg-muted/30 px-3 py-1 font-mono text-xs hover:border-primary/40 hover:bg-primary/10"
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {entity && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center gap-2">
                <h2 className="break-all font-mono text-lg sm:text-xl">{entity.name}</h2>
                <Badge variant="secondary">{entity.kind}</Badge>
              </div>

              {entity.returns && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Returns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="font-mono text-[#00F0FF]">
                      {entity.returns}
                    </code>
                  </CardContent>
                </Card>
              )}

              {entity.arguments &&
                Object.keys(entity.arguments).length > 0 && (
                  <EntityFieldsTable
                    fields={entity.arguments}
                    title="Arguments"
                  />
                )}

              {entity.fields && (
                <EntityFieldsTable fields={entity.fields} />
              )}

              {auditType && (
                <AuditPanel name={entity.name} type={auditType} />
              )}
            </div>
          )}
        </div>
      </RequireConnection>
    </>
  );
}
