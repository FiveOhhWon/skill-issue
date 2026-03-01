"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Hammer,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  Copy,
  Download,
  ExternalLink,
  RefreshCw,
  FileCode2,
  ClipboardCheck,
  Search,
  ShieldCheck,
  AlertTriangle,
  Info,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useForgeStream,
  STAGE_ORDER,
  type ForgeStage,
} from "@/hooks/use-forge-stream";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const KEBAB_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const BUILDER_NAME_KEY = "skill-issue:builder:skill-name";
const BUILDER_DESCRIPTION_KEY = "skill-issue:builder:description";

const STAGE_META: Record<
  ForgeStage,
  { icon: typeof Hammer; label: string }
> = {
  planning: { icon: Search, label: "Planning" },
  writing: { icon: FileCode2, label: "Writing" },
  reviewing: { icon: ClipboardCheck, label: "Reviewing" },
  validating: { icon: ShieldCheck, label: "Validating" },
};

/* ------------------------------------------------------------------ */
/*  Stage progress visualization                                       */
/* ------------------------------------------------------------------ */

function StageProgress({
  currentStage,
  isRunning,
  isCompleted,
}: {
  currentStage: ForgeStage | null;
  isRunning: boolean;
  isCompleted: boolean;
}) {
  const currentIndex = currentStage
    ? STAGE_ORDER.indexOf(currentStage)
    : -1;

  function getStageStatus(
    index: number
  ): "pending" | "active" | "completed" {
    if (isCompleted) return "completed";
    if (!isRunning) return "pending";
    if (index < currentIndex) return "completed";
    if (index === currentIndex) return "active";
    return "pending";
  }

  // Progress bar fill percentage
  const progressPercent = isCompleted
    ? 100
    : !isRunning || currentIndex < 0
      ? 0
      : ((currentIndex + 0.5) / STAGE_ORDER.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stage indicators */}
      <div className="flex items-start justify-between">
        {STAGE_ORDER.map((stage, i) => {
          const meta = STAGE_META[stage];
          const stageStatus = getStageStatus(i);
          const Icon = meta.icon;

          return (
            <div
              key={stage}
              className="flex flex-col items-center gap-2"
            >
              {/* Circle indicator */}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  stageStatus === "pending" &&
                    "border-border bg-secondary text-muted-foreground",
                  stageStatus === "active" &&
                    "border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(124,92,252,0.5)]",
                  stageStatus === "completed" &&
                    "border-green bg-green/10 text-green"
                )}
              >
                {stageStatus === "completed" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : stageStatus === "active" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  stageStatus === "pending" && "text-muted-foreground",
                  stageStatus === "active" && "text-primary",
                  stageStatus === "completed" && "text-green"
                )}
              >
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function BuilderPage() {
  const [skillName, setSkillName] = useState("");
  const [description, setDescription] = useState("");
  const [sessionRestored, setSessionRestored] = useState(false);
  const [copied, setCopied] = useState(false);

  const { status, currentStage, progress, result, error, lastRequest, run, cancel } =
    useForgeStream();

  useEffect(() => {
    try {
      const savedName = sessionStorage.getItem(BUILDER_NAME_KEY);
      const savedDescription = sessionStorage.getItem(BUILDER_DESCRIPTION_KEY);
      if (savedName) setSkillName((prev) => prev || savedName);
      if (savedDescription) setDescription((prev) => prev || savedDescription);
    } catch {
      // sessionStorage may be unavailable in private/restricted environments.
    } finally {
      setSessionRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionRestored) return;
    try {
      sessionStorage.setItem(BUILDER_NAME_KEY, skillName);
      sessionStorage.setItem(BUILDER_DESCRIPTION_KEY, description);
    } catch {
      // sessionStorage may be unavailable in private/restricted environments.
    }
  }, [description, sessionRestored, skillName]);

  useEffect(() => {
    if (!lastRequest) return;
    if (!skillName) setSkillName(lastRequest.name);
    if (!description) setDescription(lastRequest.description);
  }, [lastRequest, skillName, description]);

  /* ---------------------------------------------------------------- */
  /*  Validation                                                       */
  /* ---------------------------------------------------------------- */

  const nameError = useMemo(() => {
    if (skillName.length === 0) return null;
    if (!KEBAB_RE.test(skillName)) {
      return "Name must be lowercase kebab-case (e.g., my-skill-name)";
    }
    return null;
  }, [skillName]);

  const isValid =
    skillName.length > 0 && !nameError && description.trim().length > 0;
  const isRunning = status === "running";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  const handleRun = useCallback(() => {
    if (!isValid || isRunning) return;
    run(skillName, description);
  }, [isValid, isRunning, run, skillName, description]);

  const handleCopy = useCallback(async () => {
    if (!result?.skillMd) return;
    await navigator.clipboard.writeText(result.skillMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result?.skillMd]);

  const handleDownload = useCallback(() => {
    if (!result?.skillMd) return;
    const blob = new Blob([result.skillMd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${skillName}.skill.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result?.skillMd, skillName]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Hammer className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            Skill Builder
          </h1>
        </div>
        <p className="text-muted-foreground">
          Describe what you want and the AI forge will plan, write, review,
          and validate a new skill definition.
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Define Your Skill</CardTitle>
          <CardDescription>
            Provide a name and description for the skill you want to build.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Skill Name */}
          <div className="space-y-2">
            <label
              htmlFor="skill-name"
              className="text-sm font-medium text-foreground"
            >
              Skill Name
            </label>
            <Input
              id="skill-name"
              placeholder="my-skill-name"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              disabled={isRunning}
              className={cn(
                nameError &&
                  "border-destructive focus-visible:ring-destructive"
              )}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="skill-description"
              className="text-sm font-medium text-foreground"
            >
              Description
            </label>
            <Textarea
              id="skill-description"
              placeholder="Describe what this skill should do, what inputs it takes, and what outputs it produces..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isRunning}
              rows={4}
            />
          </div>

          {/* Build Button */}
          <div className="flex items-center gap-3">
            {isRunning ? (
              <Button variant="destructive" onClick={cancel}>
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            ) : (
              <Button
                onClick={handleRun}
                disabled={!isValid || isRunning}
              >
                {isFailed || isCompleted ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Hammer className="h-4 w-4" />
                )}
                {isFailed
                  ? "Retry Build"
                  : isCompleted
                    ? "Rebuild"
                    : "Build Skill"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stage Progress */}
      {(isRunning || isCompleted || isFailed) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Build Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <StageProgress
              currentStage={currentStage}
              isRunning={isRunning}
              isCompleted={isCompleted}
            />

            {/* Progress log */}
            {progress.length > 0 && (
              <div className="mt-4 space-y-1">
                {progress.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Circle className="h-1.5 w-1.5 shrink-0 fill-current" />
                    <span className="font-medium text-foreground/70">
                      [{STAGE_META[p.stage].label}]
                    </span>
                    <span>{p.message}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {isFailed && error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-4">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">
                Build Failed
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRun}
                disabled={!isValid}
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isCompleted && result && (
        <div className="space-y-6">
          <Separator />

          {/* Review & Validation Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Review */}
            <Card
              className={cn(
                result.review.pass
                  ? "border-green/30"
                  : "border-destructive/30"
              )}
            >
              <CardContent className="flex items-center gap-3 py-4">
                {result.review.pass ? (
                  <CheckCircle2 className="h-5 w-5 text-green" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium">Review</p>
                  <Badge
                    variant={result.review.pass ? "success" : "destructive"}
                  >
                    {result.review.pass ? "Pass" : "Fail"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Validation */}
            <Card
              className={cn(
                result.validation.valid
                  ? "border-green/30"
                  : "border-destructive/30"
              )}
            >
              <CardContent className="flex items-center gap-3 py-4">
                {result.validation.valid ? (
                  <CheckCircle2 className="h-5 w-5 text-green" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <div>
                  <p className="text-sm font-medium">Validation</p>
                  <Badge
                    variant={
                      result.validation.valid ? "success" : "destructive"
                    }
                  >
                    {result.validation.valid ? "Valid" : "Invalid"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issues */}
          {result.review.issues.length > 0 && (
            <Card className="border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Issues ({result.review.issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.review.issues.map((issue, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {result.validation.warnings.length > 0 && (
            <Card className="border-warning/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings ({result.validation.warnings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.validation.warnings.map((w, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                      {w}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Validation Errors */}
          {result.validation.errors.length > 0 && (
            <Card className="border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <XCircle className="h-4 w-4" />
                  Validation Errors ({result.validation.errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.validation.errors.map((e, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      {e}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {result.review.suggestions.length > 0 && (
            <Card className="border-cyan/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-cyan">
                  <Lightbulb className="h-4 w-4" />
                  Suggestions ({result.review.suggestions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.review.suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Generated SKILL.md */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Generated SKILL.md
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-3 w-3 text-green" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[500px] overflow-auto rounded-lg bg-code-bg p-4 text-sm text-muted-foreground">
                <code>{result.skillMd}</code>
              </pre>
            </CardContent>
          </Card>

          {/* Edit in Editor */}
          <div className="flex justify-end">
            <Button asChild variant="cyan">
              <Link href={`/skills/${skillName}/edit`}>
                <ExternalLink className="h-4 w-4" />
                Edit in Editor
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
