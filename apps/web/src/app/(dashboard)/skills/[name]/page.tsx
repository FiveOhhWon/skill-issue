"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Copy,
  Check,
  Play,
  Square,
  Loader2,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "@/hooks/use-session";
import { useSkillStream } from "@/hooks/use-skill-stream";
import { OutputRenderer } from "@/components/renderers/output-renderer";
import { renderMarkdown } from "@/lib/markdown";

interface SkillData {
  name: string;
  description: string;
  version: string;
  tools: string[];
  composable_with: string[];
  body: string;
  raw: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OverviewTab({ body }: { body: string }) {
  if (!body.trim()) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No overview content available for this skill.
      </p>
    );
  }

  return (
    <div
      className="prose-custom max-w-none py-4"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
    />
  );
}

function RunTab({ skillName }: { skillName: string }) {
  const { sessionId } = useSession();
  const { status, progress, result, error, run, cancel } =
    useSkillStream(sessionId);
  const [input, setInput] = useState("");

  const handleRun = useCallback(() => {
    if (!skillName) return;
    run(skillName, { query: input });
  }, [skillName, input, run]);

  const isRunning = status === "running";

  return (
    <div className="space-y-6 py-4">
      {/* Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Input / Query</label>
        <Textarea
          placeholder={`Describe what you want the "${skillName}" skill to do...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          disabled={isRunning}
          className="resize-y font-mono text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {isRunning ? (
          <Button variant="destructive" size="sm" onClick={cancel}>
            <Square className="h-3.5 w-3.5" />
            Cancel
          </Button>
        ) : (
          <Button size="sm" onClick={handleRun} disabled={!input.trim()}>
            <Play className="h-3.5 w-3.5" />
            Run Skill
          </Button>
        )}
      </div>

      {/* Progress */}
      {isRunning && progress && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{progress.step}</p>
            <p className="text-xs text-muted-foreground truncate">
              {progress.message}
            </p>
          </div>
        </div>
      )}

      {isRunning && !progress && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Starting skill...</p>
        </div>
      )}

      {/* Result */}
      {(status === "completed" || status === "failed" || result != null) && (
        <div>
          <Separator className="mb-4" />
          <OutputRenderer
            data={result}
            loading={false}
            error={error}
            onRetry={handleRun}
          />
        </div>
      )}
    </div>
  );
}

function RawTab({ raw }: { raw: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [raw]);

  return (
    <div className="relative py-4">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleCopy}
        className="absolute right-2 top-6 z-10"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
      <ScrollArea className="max-h-[600px]">
        <pre className="rounded-lg bg-code-bg p-4 text-sm leading-relaxed text-muted-foreground overflow-x-auto">
          <code>{raw}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-5 w-20" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SkillDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const [skill, setSkill] = useState<SkillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSkill() {
      try {
        const res = await fetch(`/api/skills/${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: SkillData = await res.json();
        setSkill(data);
      } catch (err) {
        setFetchError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchSkill();
  }, [name]);

  if (loading) return <DetailSkeleton />;

  if (fetchError || !skill) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-semibold text-destructive">
          Failed to load skill
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {fetchError || "Skill not found."}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/skills">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Skills
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back */}
      <Link
        href="/skills"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Skills
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold gradient-text">{skill.name}</h1>
          <Button asChild size="sm" variant="outline">
            <Link href={`/skills/${name}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit Skill
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">v{skill.version}</Badge>
          {skill.tools.map((tool) => (
            <Badge key={tool} variant="cyan" className="text-xs">
              <Wrench className="mr-1 h-3 w-3" />
              {tool}
            </Badge>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">{skill.description}</p>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="run">Run</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab body={skill.body} />
        </TabsContent>

        <TabsContent value="run">
          <RunTab skillName={skill.name} />
        </TabsContent>

        <TabsContent value="raw">
          <RawTab raw={skill.raw} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
