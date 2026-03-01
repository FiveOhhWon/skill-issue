"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  DollarSign,
  BarChart3,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RendererEmpty } from "@/components/renderers/shared-states";
import { DESKTOP_OPEN_APP_EVENT } from "@/lib/desktop/events";
import { mapPathnameToDesktopDashboard, parseDesktopDeepLinkFromSearchParams } from "@/lib/desktop/query";

interface HistoryRecord {
  id: string;
  type: string;
  name: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  steps?: unknown[];
}

const QUICK_ACTIONS = [
  {
    title: "Content Pipeline",
    description: "Research topics, analyze competitors, and generate briefs",
    href: "/pipelines/content/run",
    icon: GitBranch,
    accent: "cyan" as const,
  },
  {
    title: "Sponsor Proposal",
    description: "Analyze metrics and draft sponsorship proposals",
    href: "/pipelines/sponsor/run",
    icon: DollarSign,
    accent: "purple" as const,
  },
  {
    title: "Performance Report",
    description: "Generate comprehensive newsletter performance reports",
    href: "/pipelines/reporting/run",
    icon: BarChart3,
    accent: "green" as const,
  },
];

const ACCENT_STYLES = {
  cyan: {
    border: "border-cyan/30 hover:border-cyan/45",
    iconBg: "bg-cyan/12",
    iconText: "text-cyan",
    arrow: "text-cyan",
  },
  purple: {
    border: "border-purple/30 hover:border-purple/45",
    iconBg: "bg-primary/12",
    iconText: "text-primary",
    arrow: "text-primary",
  },
  green: {
    border: "border-green/30 hover:border-green/45",
    iconBg: "bg-green/12",
    iconText: "text-green",
    arrow: "text-green",
  },
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function statusVariant(status: string) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "failed":
      return "destructive" as const;
    case "running":
      return "default" as const;
    case "partial":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

function typeBadgeVariant(type: string) {
  switch (type) {
    case "chat":
      return "secondary" as const;
    case "pipeline":
      return "cyan" as const;
    case "skill":
      return "default" as const;
    case "builder":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

function openDesktopPath(path: string): boolean {
  if (typeof window === "undefined") return false;
  if (window.self !== window.top) return false;
  if (window.location.pathname !== "/dashboard") return false;

  const absolute = new URL(path, window.location.origin);
  const mapped = mapPathnameToDesktopDashboard(absolute.pathname, absolute.searchParams);
  if (!mapped) return false;

  const mappedUrl = new URL(mapped, window.location.origin);
  const deepLink = parseDesktopDeepLinkFromSearchParams(mappedUrl.searchParams);
  if (!deepLink) return false;

  window.dispatchEvent(new CustomEvent(DESKTOP_OPEN_APP_EVENT, { detail: deepLink }));
  return true;
}

export function DashboardContent() {
  const router = useRouter();
  const [runs, setRuns] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRuns() {
      try {
        const res = await fetch("/api/history?limit=10");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setRuns(Array.isArray(data) ? data : data.records ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRuns();
    return () => {
      cancelled = true;
    };
  }, []);

  function openPath(path: string) {
    if (openDesktopPath(path)) return;
    router.push(path);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-semibold tracking-tight gradient-text">Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Quick actions and recent activity overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const style = ACCENT_STYLES[action.accent];
          return (
            <Link
              key={action.href}
              href={action.href}
              onClick={(event) => {
                if (openDesktopPath(action.href)) {
                  event.preventDefault();
                }
              }}
            >
              <Card
                className={`group cursor-pointer transition-all duration-200 hover:bg-card-hover ${style.border}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.iconBg}`}
                    >
                      <action.icon className={`h-5 w-5 ${style.iconText}`} />
                    </div>
                    <ArrowRight
                      className={`h-4 w-4 ${style.arrow} opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100`}
                    />
                  </div>
                  <CardTitle className="mt-3 text-base">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Recent Runs</h2>
          </div>
          {runs.length > 0 && (
            <Link
              href="/history"
              onClick={(event) => {
                if (openDesktopPath("/history")) {
                  event.preventDefault();
                }
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {loading ? (
          <Card>
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="ml-auto h-5 w-16" />
                </div>
              ))}
            </div>
          </Card>
        ) : error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : runs.length === 0 ? (
          <Card>
            <CardContent className="py-0">
              <RendererEmpty
                title="No runs yet"
                description="Run your first pipeline to see results here."
                action="Run your first pipeline"
                onAction={() => openPath("/pipelines")}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {runs.map((run) => (
                    <tr
                      key={run.id}
                      className="cursor-pointer transition-colors hover:bg-card-hover"
                      onClick={() => openPath(`/history?type=${encodeURIComponent(run.type)}`)}
                    >
                      <td className="whitespace-nowrap px-6 py-3">
                        <Badge variant={typeBadgeVariant(run.type)}>{run.type}</Badge>
                      </td>
                      <td className="px-6 py-3 text-sm font-medium">{run.name}</td>
                      <td className="whitespace-nowrap px-6 py-3">
                        <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-right text-sm text-muted-foreground">
                        {relativeTime(run.startedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
