"use client";

import Link from "next/link";

export function DesktopTopbar() {
  return (
    <header className="flex h-[54px] items-center justify-between border-b border-[var(--os-window-edge)] bg-[rgba(243,236,222,0.94)] px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3 text-[var(--os-ink)]">
        <span className="h-[22px] w-[22px] rotate-[-6deg] rounded-[5px] border border-[var(--os-ink)] bg-[linear-gradient(135deg,var(--os-accent),#f8c75d)]" />
        <span className="text-sm font-semibold tracking-[0.01em]">Skill Issues OS</span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="rounded-[8px] border border-[var(--os-line)] bg-[var(--os-panel)] px-2 py-1 text-[11px] font-medium text-[var(--os-ink-soft)] hover:bg-[var(--os-paper-dark)]"
        >
          Settings
        </Link>
        <span className="rounded-[8px] border border-[var(--os-ink)] bg-[#fff8ec] px-2 py-1 font-mono text-[11px] text-[var(--os-ink)]">
          WORKSPACE: LIVE
        </span>
      </div>
    </header>
  );
}
