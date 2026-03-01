"use client";

import { useState, useEffect, useCallback, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  Play,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Eye,
  Code,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  parseSkillMarkdown,
  validateFrontmatter,
  type FrontmatterData,
  type ValidationResult,
} from "@/lib/skill-md";
import { renderMarkdown } from "@/lib/markdown";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

function MetadataTable({ fm }: { fm: FrontmatterData }) {
  const rows: [string, React.ReactNode][] = [];

  if (fm.name) rows.push(["Name", <span key="name" className="font-mono text-primary">{String(fm.name)}</span>]);
  if (fm.version) rows.push(["Version", <Badge key="ver" variant="outline">{String(fm.version)}</Badge>]);
  if (fm.description) rows.push(["Description", <span key="desc">{String(fm.description)}</span>]);
  if (Array.isArray(fm.tools) && fm.tools.length > 0) {
    rows.push([
      "Tools",
      <div key="tools" className="flex flex-wrap gap-1">
        {fm.tools.map((t) => (
          <Badge key={t} variant="cyan" className="text-xs">
            <Wrench className="mr-1 h-3 w-3" />
            {t}
          </Badge>
        ))}
      </div>,
    ]);
  }
  if (Array.isArray(fm.composable_with) && fm.composable_with.length > 0) {
    rows.push([
      "Composable With",
      <div key="comp" className="flex flex-wrap gap-1">
        {fm.composable_with.map((c) => (
          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
        ))}
      </div>,
    ]);
  }

  // Render any extra keys
  for (const [key, val] of Object.entries(fm)) {
    if (["name", "version", "description", "tools", "composable_with"].includes(key)) continue;
    if (val === undefined || val === null || val === "") continue;
    rows.push([key, <span key={key} className="font-mono text-xs">{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>]);
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No frontmatter detected.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={label} className={i % 2 === 0 ? "bg-secondary/50" : ""}>
              <td className="px-3 py-2 font-medium text-muted-foreground w-36 align-top">
                {label}
              </td>
              <td className="px-3 py-2">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ValidationBar({ validation }: { validation: ValidationResult }) {
  if (validation.valid) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green/20 bg-green/5 px-3 py-2">
        <Check className="h-4 w-4 text-green" />
        <span className="text-sm font-medium text-green">Valid</span>
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="text-sm font-medium text-destructive">
          Validation errors
        </span>
      </div>
      <ul className="ml-6 space-y-0.5">
        {validation.errors.map((err) => (
          <li key={err} className="text-xs text-destructive/80 list-disc">
            {err}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex h-[calc(100vh-12rem)] gap-0 p-6">
      <Skeleton className="h-full flex-1 rounded-l-lg" />
      <Skeleton className="h-full flex-1 rounded-r-lg" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SkillEditorPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const router = useRouter();

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [deleting, setDeleting] = useState(false);

  // Fetch initial content
  useEffect(() => {
    async function fetchSkill() {
      try {
        const res = await fetch(`/api/skills/${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: SkillData = await res.json();
        setContent(data.raw);
      } catch (err) {
        setFetchError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchSkill();
  }, [name]);

  // Derived state
  const { frontmatter, body } = useMemo(() => parseSkillMarkdown(content), [content]);
  const validation = useMemo(() => validateFrontmatter(frontmatter), [frontmatter]);

  // Line count for gutter
  const lineCount = useMemo(() => content.split("\n").length, [content]);

  // Save handler
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  }, [name, content]);

  // Delete handler
  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push("/skills");
    } catch {
      setDeleting(false);
    }
  }, [name, router]);

  // Keyboard shortcut: Ctrl/Cmd + S to save
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  if (loading) return <EditorSkeleton />;

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-semibold text-destructive">
          Failed to load skill
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{fetchError}</p>
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
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href={`/skills/${name}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <h2 className="text-sm font-semibold">
            <span className="text-muted-foreground">Editing: </span>
            <span className="gradient-text">{name}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Save status */}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-green">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <X className="h-3 w-3" />
              Save failed
            </span>
          )}

          <Button
            size="sm"
            variant="outline"
            asChild
          >
            <Link href={`/skills/${name}#run`}>
              <Play className="h-3.5 w-3.5" />
              Run
            </Link>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Skill</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete <strong>{name}</strong>? This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !validation.valid}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Split panes */}
      <div className="flex flex-1 min-h-0">
        {/* Left pane — Editor */}
        <div className="flex flex-1 flex-col border-r border-border">
          <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-3 py-1.5">
            <Code className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              SKILL.md
            </span>
          </div>
          <div className="relative flex flex-1 min-h-0">
            {/* Line numbers */}
            <div
              className="pointer-events-none select-none border-r border-border bg-code-bg px-2 py-3 text-right font-mono text-xs leading-[1.625rem] text-text-muted overflow-hidden shrink-0"
              aria-hidden="true"
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1}>{i + 1}</div>
              ))}
            </div>
            {/* Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              className="flex-1 resize-none bg-code-bg p-3 font-mono text-sm leading-[1.625rem] text-foreground outline-none placeholder:text-muted-foreground"
              style={{ tabSize: 2 }}
            />
          </div>
        </div>

        {/* Right pane — Preview */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-3 py-1.5">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Preview
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-6 p-4">
              {/* Frontmatter metadata */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Metadata
                </h3>
                <MetadataTable fm={frontmatter} />
              </div>

              <Separator />

              {/* Body preview */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Body
                </h3>
                {body ? (
                  <div
                    className="prose-custom max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(body),
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No body content yet.
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Validation bar */}
      <div className="border-t border-border px-4 py-2">
        <ValidationBar validation={validation} />
      </div>
    </div>
  );
}
