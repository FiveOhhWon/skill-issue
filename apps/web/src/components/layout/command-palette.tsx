"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  GitBranch,
  Hammer,
  Clock,
  Settings,
  Search,
  Play,
} from "lucide-react";
import { DESKTOP_OPEN_APP_EVENT } from "@/lib/desktop/events";
import type { DesktopAppId, DesktopViewState } from "@/lib/desktop/types";

interface DesktopTarget {
  appId: DesktopAppId;
  viewState?: DesktopViewState;
}

interface CommandItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  desktop?: DesktopTarget;
}

const COMMANDS: CommandItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    desktop: { appId: "dashboard" },
  },
  {
    id: "chat",
    label: "Ops Chat",
    icon: Sparkles,
    href: "/dashboard?app=chat",
    desktop: { appId: "chat" },
  },
  {
    id: "skills",
    label: "Skills Library",
    icon: Sparkles,
    href: "/skills",
    desktop: { appId: "skills", viewState: { view: "list" } },
  },
  {
    id: "pipelines",
    label: "Pipelines",
    icon: GitBranch,
    href: "/pipelines",
    desktop: { appId: "pipelines", viewState: { view: "list" } },
  },
  {
    id: "builder",
    label: "Skill Builder",
    icon: Hammer,
    href: "/builder",
    desktop: { appId: "builder" },
  },
  {
    id: "history",
    label: "Run History",
    icon: Clock,
    href: "/history",
    desktop: { appId: "history", viewState: { view: "list" } },
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
  {
    id: "run-content",
    label: "Run Content Pipeline",
    icon: Play,
    href: "/pipelines/content/run",
    desktop: {
      appId: "pipelines",
      viewState: { view: "run", pipeline: "content" },
    },
  },
  {
    id: "run-sponsor",
    label: "Run Sponsor Pipeline",
    icon: Play,
    href: "/pipelines/sponsor/run",
    desktop: {
      appId: "pipelines",
      viewState: { view: "run", pipeline: "sponsor" },
    },
  },
  {
    id: "run-reporting",
    label: "Run Reporting Pipeline",
    icon: Play,
    href: "/pipelines/reporting/run",
    desktop: {
      appId: "pipelines",
      viewState: { view: "run", pipeline: "reporting" },
    },
  },
];

function buildDesktopUrl(target: DesktopTarget): string {
  const params = new URLSearchParams();
  params.set("app", target.appId);

  const viewState = target.viewState as Record<string, unknown> | undefined;
  if (viewState?.view && typeof viewState.view === "string") {
    params.set("view", viewState.view);
  }

  if (typeof viewState?.skill === "string") {
    params.set("skill", viewState.skill);
  }

  if (typeof viewState?.pipeline === "string") {
    params.set("pipeline", viewState.pipeline);
  }

  if (typeof viewState?.type === "string") {
    params.set("type", viewState.type);
  }

  if (typeof viewState?.status === "string") {
    params.set("status", viewState.status);
  }

  if (typeof viewState?.name === "string") {
    params.set("name", viewState.name);
  }

  return `/dashboard?${params.toString()}`;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const filtered = useMemo(
    () => COMMANDS.filter((cmd) => cmd.label.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  const handleSelect = useCallback(
    (command: CommandItem) => {
      setOpen(false);
      setQuery("");

      if (command.desktop) {
        if (pathname === "/dashboard") {
          window.dispatchEvent(
            new CustomEvent(DESKTOP_OPEN_APP_EVENT, {
              detail: command.desktop,
            })
          );
          return;
        }

        router.push(buildDesktopUrl(command.desktop));
        return;
      }

      router.push(command.href);
    },
    [pathname, router]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands..."
            autoFocus
            className="flex-1 bg-transparent py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
              } else if (event.key === "Enter" && filtered[selectedIndex]) {
                handleSelect(filtered[selectedIndex]);
              }
            }}
          />
          <kbd className="hidden rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No commands found.</div>
          ) : (
            filtered.map((command, index) => (
              <button
                key={command.id}
                onClick={() => handleSelect(command)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <command.icon className="h-4 w-4" />
                <span>{command.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
