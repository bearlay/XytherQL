"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AuditPanel } from "@/components/audit-panel";
import { PageHeader } from "@/components/page-header";
import { RequireConnection } from "@/components/require-connection";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEntity, type EntityDetail } from "@/lib/api";
import { useSession } from "@/lib/session-context";

export default function MutationDetailPage() {
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
      <Link
        href="/mutations"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#00F0FF]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to mutations
      </Link>
      <PageHeader
        title={name}
        description="Mutation signature and safe validation probe."
      />
      <RequireConnection>
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading mutation spec…
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {entity && (
          <div className="space-y-6">
            <Badge variant="default">MUTATION</Badge>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Return type</CardTitle>
              </CardHeader>
              <CardContent>
                <code className="font-mono text-sm text-[#00F0FF]">
                  {entity.returns}
                </code>
              </CardContent>
            </Card>
            {entity.arguments && Object.keys(entity.arguments).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Arguments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(entity.arguments).map(([arg, type]) => (
                    <div
                      key={arg}
                      className="flex justify-between rounded-md bg-muted/30 px-3 py-2 font-mono text-sm"
                    >
                      <span>{arg}</span>
                      <span className="text-[#00F0FF]/80">{type}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            <AuditPanel name={name} type="mutation" />
          </div>
        )}
      </RequireConnection>
    </>
  );
}
