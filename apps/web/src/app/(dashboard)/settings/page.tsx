"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Settings,
  Key,
  Info,
  FolderOpen,
  Upload,
  FileJson,
  FileSpreadsheet,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  X,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FixtureFile {
  name: string;
  type: string;
  size: number;
  data?: unknown;
  preview?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function detectFixtureType(name: string): string {
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".tsv")) return "tsv";
  return "unknown";
}

/* ------------------------------------------------------------------ */
/*  API Keys Section                                                   */
/* ------------------------------------------------------------------ */

function ApiKeysSection() {
  // In a real app this would be fetched from a server-side endpoint
  // For now, show a static display
  const [configured] = useState(true);
  const maskedKey = configured ? "sk-ant-...XXXX" : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Key className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">API Keys</CardTitle>
            <CardDescription>
              Manage your API key configuration.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">ANTHROPIC_API_KEY</span>
            {maskedKey && (
              <code className="rounded bg-code-bg px-2 py-0.5 text-xs text-muted-foreground font-mono">
                {maskedKey}
              </code>
            )}
          </div>
          <Badge variant={configured ? "success" : "destructive"}>
            {configured ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                configured
              </>
            ) : (
              <>
                <AlertCircle className="mr-1 h-3 w-3" />
                not set
              </>
            )}
          </Badge>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          API keys are configured via environment variables on the server.
          They are never exposed to the browser.
        </p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  About Section                                                      */
/* ------------------------------------------------------------------ */

function AboutSection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/10">
            <Info className="h-4 w-4 text-cyan" />
          </div>
          <div>
            <CardTitle className="text-base">About</CardTitle>
            <CardDescription>Application information.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Application</span>
            <span className="font-medium gradient-text">skill-issue</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Version</span>
            <Badge variant="secondary">v1.0.0</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Repository</span>
            <a
              href="https://github.com/skill-issue"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Framework</span>
            <span className="font-medium">Next.js 15 + React 19</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Fixture Management Section                                         */
/* ------------------------------------------------------------------ */

function FixtureManagementSection() {
  const [fixtures, setFixtures] = useState<FixtureFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [expandedFixtures, setExpandedFixtures] = useState<Set<string>>(
    new Set()
  );
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFixtures = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/fixtures/upload");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const files: FixtureFile[] = (Array.isArray(data) ? data : data.files ?? []).map(
        (f: FixtureFile | string) => {
          if (typeof f === "string") {
            return { name: f, type: detectFixtureType(f), size: 0 };
          }
          return {
            ...f,
            type: f.type || detectFixtureType(f.name),
          };
        }
      );
      setFixtures(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fixtures");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFixtures();
  }, [fetchFixtures]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("file", file);
      });

      const res = await fetch("/api/fixtures/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
      await fetchFixtures();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  }

  function toggleExpand(name: string) {
    setExpandedFixtures((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  function renderPreview(fixture: FixtureFile) {
    if (fixture.data && fixture.type === "json") {
      // Render as formatted table if it's an array of objects
      if (
        Array.isArray(fixture.data) &&
        fixture.data.length > 0 &&
        typeof fixture.data[0] === "object"
      ) {
        const keys = Object.keys(fixture.data[0] as Record<string, unknown>);
        return (
          <ScrollArea className="max-h-64">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {keys.map((key) => (
                      <th
                        key={key}
                        className="px-3 py-2 text-left font-medium text-muted-foreground"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(fixture.data as Record<string, unknown>[])
                    .slice(0, 20)
                    .map((row, i) => (
                      <tr key={i}>
                        {keys.map((key) => (
                          <td
                            key={key}
                            className="max-w-48 truncate px-3 py-1.5 text-muted-foreground"
                          >
                            {typeof row[key] === "object"
                              ? JSON.stringify(row[key])
                              : String(row[key] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
              {Array.isArray(fixture.data) && fixture.data.length > 20 && (
                <p className="p-2 text-center text-xs text-muted-foreground">
                  Showing 20 of {fixture.data.length} rows
                </p>
              )}
            </div>
          </ScrollArea>
        );
      }

      // Generic JSON
      return (
        <ScrollArea className="max-h-64">
          <pre className="rounded-lg bg-code-bg p-3 text-xs text-muted-foreground font-mono">
            {JSON.stringify(fixture.data, null, 2)}
          </pre>
        </ScrollArea>
      );
    }

    if (fixture.preview) {
      return (
        <ScrollArea className="max-h-64">
          <pre className="rounded-lg bg-code-bg p-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap">
            {fixture.preview}
          </pre>
        </ScrollArea>
      );
    }

    return (
      <p className="text-xs text-muted-foreground">
        No preview available for this file.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green/10">
            <FolderOpen className="h-4 w-4 text-green" />
          </div>
          <div>
            <CardTitle className="text-base">Fixture Management</CardTitle>
            <CardDescription>
              Upload and manage data fixtures for skills and pipelines.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-card-hover"
          }`}
        >
          <Upload
            className={`h-8 w-8 ${
              dragActive ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <p className="mt-3 text-sm font-medium">
            {uploading
              ? "Uploading..."
              : "Drop files here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JSON and CSV files accepted
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,.tsv"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto"
              onClick={() => setError(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Fixture List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border p-4"
              >
                <Skeleton className="h-8 w-8" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        ) : fixtures.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              No fixtures uploaded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {fixtures.map((fixture) => {
              const expanded = expandedFixtures.has(fixture.name);
              const typeIcon =
                fixture.type === "json" ? FileJson : FileSpreadsheet;
              const TypeIcon = typeIcon;

              return (
                <div
                  key={fixture.name}
                  className="rounded-lg border border-border transition-colors hover:border-border/80"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(fixture.name)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {fixture.name}
                      </p>
                      {fixture.size > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(fixture.size)}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        fixture.type === "json" ? "default" : "cyan"
                      }
                    >
                      {fixture.type}
                    </Badge>
                  </button>

                  {expanded && (
                    <div className="border-t border-border px-4 py-3">
                      {renderPreview(fixture)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            Settings
          </h1>
        </div>
        <p className="text-muted-foreground">
          Manage API keys, fixtures, and application preferences.
        </p>
      </div>

      {/* Sections */}
      <ApiKeysSection />
      <AboutSection />
      <FixtureManagementSection />
    </div>
  );
}
