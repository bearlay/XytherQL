"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  XytherQLIcon,
  XytherQLWordmark,
} from "@/components/brand/xytherql-logo";

export function MobileHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#0B1020]/95 px-4 backdrop-blur-xl lg:hidden">
      <Link href="/" className="flex min-w-0 items-center gap-2.5">
        <XytherQLIcon className="h-9 w-8 shrink-0" />
        <XytherQLWordmark compact />
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        onClick={onMenuOpen}
        className="shrink-0 text-foreground hover:bg-white/5"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </header>
  );
}
