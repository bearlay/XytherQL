"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AuditPanel } from "@/components/audit-panel";
import { RetrieveDumpPanel } from "@/components/retrieve-dump-panel";
import { EntityFieldsTable } from "@/components/entity-fields-table";
import { PageHeader } from "@/components/page-header";
import { RequireConnection } from "@/components/require-connection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEntity, type EntityDetail } from "@/lib/api";
import { useSession } from "@/lib/session-context";

export default function TableDetailPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);
  const { session } = useSession();
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.session_id) return;
    setLoading(true);
    getEntity(session.session_id, name)
      .then(setEntity)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session?.session_id, name]);

  return (
    <>
      <Link href="/tables" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#00F0FF] sm:mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to tables
      </Link>
      <PageHeader
        title={name}
        description="Table structure and data-extraction access control test."
      />
      <RequireConnection>
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading fields…
          </div>
        )}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {entity?.fields && (
          <div className="space-y-6">
            <Badge variant="secondary">TABLE</Badge>
            <EntityFieldsTable fields={entity.fields} title="Columns / fields" />
            <AuditPanel name={name} type="table" />
            <RetrieveDumpPanel tableName={name} />
          </div>
        )}
      </RequireConnection>
    </>
  );
}
