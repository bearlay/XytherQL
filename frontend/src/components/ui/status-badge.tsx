import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  ShieldAlert,
  XCircle,
} from "lucide-react";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "muted" | "default"; icon: ReactNode }
> = {
  success: {
    label: "Retrieved",
    variant: "success",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  restricted: {
    label: "Restricted",
    variant: "success",
    icon: <Shield className="h-3 w-3" />,
  },
  handled: {
    label: "Server Handled",
    variant: "success",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  vulnerable: {
    label: "Exposed",
    variant: "danger",
    icon: <ShieldAlert className="h-3 w-3" />,
  },
  exposed_empty: {
    label: "Exposed (Empty)",
    variant: "warning",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  query_error: {
    label: "Query Error",
    variant: "warning",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  processed: {
    label: "Processed",
    variant: "warning",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  error: {
    label: "Error",
    variant: "danger",
    icon: <XCircle className="h-3 w-3" />,
  },
  unknown: {
    label: "Unknown",
    variant: "muted",
    icon: null,
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.unknown;
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}
