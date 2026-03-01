"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  ChevronDown,
  ChevronRight,
  Search,
  Copy,
  Download,
  FileText,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { OutputRenderer } from "@/components/renderers/output-renderer";
import { RendererEmpty } from "@/components/renderers/shared-states";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StepRecord {
  skill: string;
  label?: string;
  status: string;
  output?: unknown;
  error?: string;
}

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
  steps?: StepRecord[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TYPE_FILTERS = ["all", "chat", "skill", "pipeline", "builder"] as const;
const STATUS_FILTERS = ["all", "running", "completed", "failed", "partial"] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

function duration(startedAt: string, completedAt?: string): string {
  if (!completedAt) return "running...";
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
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

/* ------------------------------------------------------------------ */
/*  Export helpers                                                      */
/* ------------------------------------------------------------------ */

async function copyToClipboard(data: unknown): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toMarkdown(data: unknown, name: string): string {
  const lines: string[] = [`# ${name}`, ""];

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      lines.push(`## ${key}`, "");
      if (typeof value === "string") {
        lines.push(value, "");
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string") {
            lines.push(`- ${item}`);
          } else {
            lines.push("```json", JSON.stringify(item, null, 2), "```", "");
          }
        }
        lines.push("");
      } else {
        lines.push("```json", JSON.stringify(value, null, 2), "```", "");
      }
    }
  } else {
    lines.push("```json", JSON.stringify(data, null, 2), "```");
  }

  return lines.join("\n");
}

function downloadMarkdown(data: unknown, name: string) {
  const md = toMarkdown(data, name);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function RecordOutput({ record }: { record: HistoryRecord }) {
  if (record.output != null) {
    return (
      <OutputRenderer
        data={record.output}
        loading={false}
        error={record.error ?? null}
      />
    );
  }
  if (record.error != null) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {String(record.error)}
      </div>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">No output data available.</p>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* Fetch with filters */
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("name", searchQuery.trim());

      const qs = params.toString();
      const res = await fetch(`/api/history${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : data.records ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  /* Read URL filter on mount */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("type");
    const s = params.get("status");
    const n = params.get("name");
    if (t && TYPE_FILTERS.includes(t as (typeof TYPE_FILTERS)[number])) setTypeFilter(t);
    if (s && STATUS_FILTERS.includes(s as (typeof STATUS_FILTERS)[number])) setStatusFilter(s);
    if (n) setSearchQuery(n);
  }, []);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleCopy(id: string, data: unknown) {
    const ok = await copyToClipboard(data);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            Run History
          </h1>
        </div>
        <p className="text-muted-foreground">
          Browse past skill and pipeline executions.
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Type filter */}
            <div className="flex items-center gap-1">
              {TYPE_FILTERS.map((t) => (
                <Button
                  key={t}
                  variant={typeFilter === t ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTypeFilter(t)}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="hidden h-6 sm:block" />

            {/* Status filter */}
            <div className="flex items-center gap-1">
              {STATUS_FILTERS.map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="ml-auto h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/30">
          <CardContent className="py-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <RendererEmpty
              title="No runs found"
              description={
                typeFilter !== "all" || statusFilter !== "all" || searchQuery
                  ? "Try adjusting your filters."
                  : "Run a skill or pipeline to see results here."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const expanded = expandedIds.has(record.id);
            return (
              <Card
                key={record.id}
                className="transition-colors hover:bg-card-hover/50"
              >
                {/* Summary Row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(record.id)}
                  className="flex w-full items-center gap-4 p-5 text-left"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <Badge variant={typeBadgeVariant(record.type)}>
                    {record.type}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {record.name}
                  </span>
                  <Badge variant={statusVariant(record.status)}>
                    {record.status}
                  </Badge>
                  <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">
                    {relativeTime(record.startedAt)}
                  </span>
                  <span className="hidden whitespace-nowrap text-xs text-muted-foreground lg:inline">
                    {duration(record.startedAt, record.completedAt)}
                  </span>
                </button>

                {/* Expanded Detail */}
                {expanded && (
                  <>
                    <Separator />
                    <CardContent className="p-5">
                      {/* Metadata */}
                      <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>
                          Started: {new Date(record.startedAt).toLocaleString()}
                        </span>
                        {record.completedAt && (
                          <span>
                            Completed:{" "}
                            {new Date(record.completedAt).toLocaleString()}
                          </span>
                        )}
                        <span>
                          Duration:{" "}
                          {duration(record.startedAt, record.completedAt)}
                        </span>
                      </div>

                      <RecordOutput record={record} />

                      {/* Export Actions */}
                      {record.output != null && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopy(record.id, record.output)
                            }
                          >
                            {copiedId === record.id ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {copiedId === record.id
                              ? "Copied!"
                              : "Copy JSON"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadJson(
                                record.output,
                                `${record.name}-${record.id}`
                              )
                            }
                          >
                            <Download className="h-3 w-3" />
                            Download JSON
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadMarkdown(record.output, record.name)
                            }
                          >
                            <FileText className="h-3 w-3" />
                            Download Markdown
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
