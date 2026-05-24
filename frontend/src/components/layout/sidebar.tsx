"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  LayoutDashboard,
  LogOut,
  Network,
  Search,
  Settings,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session-context";
import { Button } from "@/components/ui/button";
import {
  XytherQLIcon,
  XytherQLWordmark,
} from "@/components/brand/xytherql-logo";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/explorer", label: "Schema Graph", icon: Network },
  { href: "/tables", label: "Tables", icon: Database },
  { href: "/mutations", label: "Mutations", icon: Zap },
  { href: "/inspector", label: "Inspector", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { connected, session, disconnectSession } = useSession();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen w-[min(18rem,88vw)] flex-col border-r border-white/5 bg-[#0B1020]/98 shadow-2xl shadow-black/40 backdrop-blur-xl",
        "transition-transform duration-300 ease-out lg:w-64 lg:translate-x-0 lg:shadow-none",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <XytherQLIcon className="h-10 w-9 shrink-0" />
          <XytherQLWordmark compact />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          aria-label="Close menu"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-[#00F0FF]/15 to-[#7A5CFF]/10 text-[#00F0FF] shadow-inner shadow-[#00F0FF]/5"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-[#00F0FF]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-4">
        {connected && session ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Connected
              </p>
              <p
                className="mt-1.5 break-all font-mono text-xs leading-relaxed text-[#00F0FF]/90"
                title={session.endpoint}
              >
                {session.endpoint}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => disconnectSession()}
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            No active session
          </p>
        )}
      </div>
    </aside>
  );
}
