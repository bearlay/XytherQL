"use client";

import Link from "next/link";
import {
  Database,
  Download,
  Shield,
  Zap,
  Boxes,
  Network,
} from "lucide-react";
import { XytherQLBanner } from "@/components/brand/xytherql-logo";
import { ConnectForm } from "@/components/connect-form";
import { BRAND_NAME } from "@/lib/brand";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session-context";
import { getExportUrl } from "@/lib/api";

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="modern-card group">
        <CardContent className="flex items-center gap-4 p-4 sm:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-[#7A5CFF]/20 transition-transform group-hover:scale-105 sm:h-12 sm:w-12">
            <Icon className="h-5 w-5 text-[#00F0FF] sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold tabular-nums sm:text-3xl">{value}</p>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { connected, session } = useSession();

  return (
    <>
      <PageHeader
        title={
          <>
            {BRAND_NAME} <span className="font-normal text-muted-foreground">Console</span>
          </>
        }
        description="Map your schema, inspect tables and mutations, and verify authorization controls — for authorized internal security reviews only."
      />

      {!connected ? (
        <div className="space-y-8">
          <XytherQLBanner />
          <ConnectForm />
        </div>
      ) : (
        <div className="space-y-8 animate-slide-up">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Tables discovered"
              value={session?.summary.tablesCount ?? 0}
              icon={Database}
              href="/tables"
            />
            <StatCard
              label="Mutations registered"
              value={session?.summary.mutationsCount ?? 0}
              icon={Zap}
              href="/mutations"
            />
            <StatCard
              label="Schema entities"
              value={session?.summary.entitiesCount ?? 0}
              icon={Boxes}
              href="/inspector"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-[#00F0FF]" />
                  Quick actions
                </CardTitle>
                <CardDescription>
                  Jump into discovery and access-control testing.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link href="/tables" className="w-full sm:w-auto">
                  <Button variant="secondary" size="sm" type="button" className="w-full sm:w-auto">
                    Browse tables
                  </Button>
                </Link>
                <Link href="/mutations" className="w-full sm:w-auto">
                  <Button variant="secondary" size="sm" type="button" className="w-full sm:w-auto">
                    Browse mutations
                  </Button>
                </Link>
                <Link href="/inspector" className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" type="button" className="w-full sm:w-auto">
                    Open inspector
                  </Button>
                </Link>
                <Link href="/explorer" className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" type="button" className="w-full sm:w-auto">
                    <Network className="h-4 w-4" />
                    Schema graph
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Download className="h-4 w-4 text-[#00F0FF]" />
                  Export schema
                </CardTitle>
                <CardDescription>
                  Download raw introspection JSON for offline analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href={getExportUrl(session!.session_id)}
                  download="schema_extract.json"
                  className="block w-full sm:inline-block sm:w-auto"
                >
                  <Button variant="outline" size="sm" type="button" className="w-full sm:w-auto">
                    <Download className="h-4 w-4" />
                    <span className="truncate">Download schema JSON</span>
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#7A5CFF]/20 bg-[#7A5CFF]/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Network className="h-4 w-4 text-[#7A5CFF]" />
                Schema ER Diagram
              </CardTitle>
              <CardDescription>
                Clean entity-relationship view of types, keys, and
                relationships — search and focus any entity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/explorer">
                <Button variant="secondary" size="sm" type="button" className="w-full sm:w-auto">
                  <Network className="h-4 w-4" />
                  Open schema graph
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-[#00F0FF]/20 bg-[#00F0FF]/5">
            <CardContent className="flex items-start gap-3 p-4">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#00F0FF]" />
              <p className="text-sm text-muted-foreground">
                Connected to{" "}
                <span className="font-mono text-[#00F0FF]/90">
                  {session?.endpoint}
                </span>
                . Session is stored in memory on the API server and in your
                browser until you disconnect.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
