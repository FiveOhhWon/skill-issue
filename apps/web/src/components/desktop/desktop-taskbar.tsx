"use client";

import { APP_LABELS, DESKTOP_APP_ORDER } from "@/lib/desktop/constants";
import type { DesktopAppId, DesktopWindowsState } from "@/lib/desktop/types";

interface DesktopTaskbarProps {
  windows: DesktopWindowsState;
  activeAppId: DesktopAppId | null;
  onTaskClick: (appId: DesktopAppId) => void;
}

export function DesktopTaskbar({ windows, activeAppId, onTaskClick }: DesktopTaskbarProps) {
  return (
    <footer className="relative z-20 flex h-[44px] items-center gap-1 border-t border-[var(--os-window-edge)] bg-[rgba(241,234,220,0.95)] px-2 backdrop-blur-sm">
      <div className="ml-auto flex items-center gap-1">
        {DESKTOP_APP_ORDER.map((appId) => {
          const window = windows[appId];
          const isOpen = window.isOpen;
          const isMinimized = window.isMinimized;
          const isActive = activeAppId === appId && isOpen && !isMinimized;

          return (
            <button
              key={appId}
              type="button"
              onClick={() => onTaskClick(appId)}
              className={`relative rounded-[8px] border px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "border-[var(--os-ink)] bg-[#ffe4b9] text-[var(--os-ink)]"
                  : isOpen
                  ? "border-[var(--os-line)] bg-[var(--os-panel)] text-[var(--os-ink-soft)]"
                  : "border-transparent bg-transparent text-[var(--os-ink-soft)] hover:border-[var(--os-line)] hover:bg-[var(--os-panel)]"
              }`}
            >
              {APP_LABELS[appId]}
              {isOpen && (
                <span
                  className={`absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full ${
                    isMinimized ? "bg-[var(--os-line)]" : "bg-[var(--os-accent)]"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </footer>
  );
}
