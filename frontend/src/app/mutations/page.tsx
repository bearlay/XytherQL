"use client";

import { RequireConnection } from "@/components/require-connection";
import { PageHeader } from "@/components/page-header";
import { SearchList } from "@/components/search-list";
import { useSession } from "@/lib/session-context";

export default function MutationsPage() {
  const { session } = useSession();

  return (
    <>
      <PageHeader
        title="Registered Mutations"
        description="Root mutation hooks — auth gateways, writes, and other state-changing operations."
      />
      <RequireConnection>
        <SearchList
          items={session?.mutations ?? []}
          basePath="/mutations"
          emptyMessage="No mutations found in the current schema."
        />
      </RequireConnection>
    </>
  );
}
