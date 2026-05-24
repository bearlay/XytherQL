"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isExplorer = pathname === "/explorer";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen">
      <MobileHeader onMenuOpen={() => setMobileOpen(true)} />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main
        className={`pt-16 transition-[padding] lg:pl-64 lg:pt-0 ${
          isExplorer
            ? "flex h-[100dvh] flex-col overflow-hidden lg:h-screen"
            : "min-h-screen"
        }`}
      >
        <div
          className={`relative bg-grid bg-grid-pattern ${
            isExplorer
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "min-h-[calc(100vh-4rem)] lg:min-h-screen"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#00F0FF]/5 via-transparent to-[#7A5CFF]/5" />
          <div
            className={
              isExplorer
                ? "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden px-2 py-2 sm:px-3 lg:px-4 lg:py-3 animate-fade-in"
                : "relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 animate-fade-in"
            }
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
