"use client";

import { AlertTriangle, RefreshCw, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

/* ---------- Loading Skeleton ---------- */
export function RendererSkeleton({ type: _type }: { type?: string }) {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-24" />
    </div>
  );
}

/* ---------- Error State ---------- */
export function RendererError({
  error,
  rawData,
  onRetry,
}: {
  error: string;
  rawData?: unknown;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
        <div className="flex-1 space-y-3">
          <p className="font-medium text-destructive">
            Failed to render output
          </p>
          <p className="text-sm text-muted-foreground">{error}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry
            </Button>
          )}
          {rawData != null && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Show raw JSON
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-code-bg p-3 text-xs text-muted-foreground">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Empty State ---------- */
export function RendererEmpty({
  title = "No results yet",
  description = "Run a skill or pipeline to see results here.",
  action,
  onAction,
}: {
  title?: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="h-12 w-12 text-text-muted" />
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action && onAction && (
        <Button onClick={onAction} className="mt-4">
          {action}
        </Button>
      )}
    </div>
  );
}
