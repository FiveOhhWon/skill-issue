"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CommandPalette } from "@/components/layout/command-palette";
import { DesktopShell } from "@/components/desktop/desktop-shell";
import { DesktopTopbar } from "@/components/desktop/desktop-topbar";
import { mapPathnameToDesktopDashboard } from "@/lib/desktop/query";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isEmbedded =
    searchParams.get("embedded") === "1" ||
    (typeof window !== "undefined" &&
      (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })());
  const redirectTarget = useMemo(() => {
    if (isEmbedded || pathname === "/dashboard") return null;
    return mapPathnameToDesktopDashboard(pathname, new URLSearchParams(searchParams.toString()));
  }, [isEmbedded, pathname, searchParams]);

  useEffect(() => {
    if (!redirectTarget) return;
    router.replace(redirectTarget, { scroll: false });
  }, [redirectTarget, router]);

  if (isEmbedded) {
    return (
      <div className="min-h-screen overflow-auto bg-[var(--os-panel)] p-4 text-[var(--os-ink)]">
        {children}
      </div>
    );
  }

  if (pathname === "/dashboard") {
    return <DesktopShell />;
  }

  if (redirectTarget) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--os-paper)] text-[var(--os-ink-soft)]">
        <p className="text-sm">Opening app window...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--os-paper)] text-[var(--os-ink)]">
      <DesktopTopbar />
      <main className="mx-auto max-w-6xl p-6">{children}</main>
      <CommandPalette />
    </div>
  );
}
