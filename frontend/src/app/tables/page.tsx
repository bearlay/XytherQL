"use client";

import { RequireConnection } from "@/components/require-connection";
import { PageHeader } from "@/components/page-header";
import { SearchList } from "@/components/search-list";
import { useSession } from "@/lib/session-context";

export default function TablesPage() {
  const { session } = useSession();

  return (
    <>
      <PageHeader
        title="Discovered Tables"
        description="Object types mapped from introspection. Select a table to inspect fields and test read access."
      />
      <RequireConnection>
        <SearchList
          items={session?.tables ?? []}
          basePath="/tables"
          emptyMessage="No tables found in the current schema."
        />
      </RequireConnection>
    </>
  );
}
