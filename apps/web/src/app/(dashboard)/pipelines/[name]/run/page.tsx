"use client";

import { useState, useCallback, useMemo, use } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Play,
  Square,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OutputRenderer } from "@/components/renderers/output-renderer";
import { useSession } from "@/hooks/use-session";
import {
  usePipelineStream,
  type PipelineStepState,
} from "@/hooks/use-pipeline-stream";
import { cn } from "@/lib/utils";
import { PIPELINES } from "@/lib/pipelines";

/* ------------------------------------------------------------------ */
/*  Custom React Flow node                                             */
/* ------------------------------------------------------------------ */

type PipelineNodeData = {
  label: string;
  skill: string;
  stepStatus: "pending" | "running" | "completed" | "failed";
  isFirst: boolean;
  isLast: boolean;
};

const STATUS_STYLES = {
  pending:
    "border-[var(--os-line)] bg-[var(--os-panel)] text-[var(--os-ink-soft)]",
  running:
    "border-[var(--os-accent)] bg-[rgba(244,163,32,0.12)] text-[var(--os-accent-dark)] animate-pulse-glow",
  completed:
    "border-[var(--os-mint)] bg-[rgba(90,167,109,0.12)] text-[var(--os-mint)]",
  failed:
    "border-destructive bg-[color-mix(in_oklab,var(--color-destructive)_12%,transparent)] text-destructive",
} as const;

const STATUS_ICONS = {
  pending: Circle,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
} as const;

function PipelineNode({ data }: NodeProps<Node<PipelineNodeData>>) {
  const Icon = STATUS_ICONS[data.stepStatus];
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 px-5 py-4 transition-all duration-300",
        STATUS_STYLES[data.stepStatus]
      )}
    >
      {/* Target handle (left) */}
      {!data.isFirst && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-[var(--os-line)] !bg-[var(--os-panel)]"
        />
      )}

      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--os-paper)]">
        <Icon
          className={cn(
            "h-4 w-4",
            data.stepStatus === "running" && "animate-spin"
          )}
        />
      </div>

      {/* Label */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">
          {data.label}
        </span>
        <span className="text-[10px] text-muted-foreground">{data.skill}</span>
      </div>

      {/* Source handle (right) */}
      {!data.isLast && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-[var(--os-line)] !bg-[var(--os-panel)]"
        />
      )}
    </div>
  );
}

const nodeTypes = { pipelineNode: PipelineNode };

/* ------------------------------------------------------------------ */
/*  Collapsible step output                                            */
/* ------------------------------------------------------------------ */

function StepOutput({
  step,
  index,
}: {
  step: PipelineStepState;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = STATUS_ICONS[step.status];

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-card-hover"
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            step.status === "pending" && "text-muted-foreground",
            step.status === "running" && "animate-spin text-primary",
            step.status === "completed" && "text-green",
            step.status === "failed" && "text-destructive"
          )}
        />
        <span className="text-sm font-medium">
          {index + 1}. {step.label}
        </span>
        <Badge
          variant={
            step.status === "completed"
              ? "success"
              : step.status === "failed"
                ? "destructive"
                : step.status === "running"
                  ? "default"
                  : "secondary"
          }
          className="ml-auto mr-2"
        >
          {step.status}
        </Badge>
        {step.output || step.error ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )
        ) : null}
      </button>

      {expanded && (step.output || step.error) && (
        <div className="border-t border-border px-4 py-4">
          {step.error ? (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{step.error}</span>
            </div>
          ) : (
            <OutputRenderer type={step.skill} data={step.output} />
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function PipelineRunPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: pipelineName } = use(params);
  const pipeline = PIPELINES[pipelineName];

  const { sessionId } = useSession();
  const { status, steps, currentStepIndex, error, run, cancel } =
    usePipelineStream(sessionId);

  /* ---------------------------------------------------------------- */
  /*  Build React Flow nodes & edges from step state                   */
  /* ---------------------------------------------------------------- */

  const stepStates = useMemo<PipelineStepState[]>(() => {
    if (steps.length > 0) return steps;
    if (!pipeline) return [];
    return pipeline.steps.map((s) => ({
      skill: s.skill,
      label: s.label,
      status: "pending" as const,
    }));
  }, [steps, pipeline]);

  const nodes = useMemo<Node<PipelineNodeData>[]>(() => {
    return stepStates.map((step, i) => ({
      id: `step-${i}`,
      type: "pipelineNode",
      position: { x: i * 340, y: 80 },
      data: {
        label: step.label,
        skill: step.skill,
        stepStatus: step.status,
        isFirst: i === 0,
        isLast: i === stepStates.length - 1,
      },
      draggable: false,
    }));
  }, [stepStates]);

  const edges = useMemo<Edge[]>(() => {
    return stepStates.slice(0, -1).map((_, i) => {
      const sourceStatus = stepStates[i].status;
      const targetStatus = stepStates[i + 1].status;
      const isActive =
        sourceStatus === "running" || targetStatus === "running";
      const isComplete =
        sourceStatus === "completed" && targetStatus !== "pending";

      return {
        id: `edge-${i}-${i + 1}`,
        source: `step-${i}`,
        target: `step-${i + 1}`,
        animated: isActive,
        style: {
          stroke: isComplete
            ? "var(--os-mint)"
            : isActive
              ? "var(--os-teal)"
              : "var(--os-line)",
          strokeWidth: 2,
        },
      };
    });
  }, [stepStates]);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  const handleRun = useCallback(() => {
    run(pipelineName);
  }, [run, pipelineName]);

  /* ---------------------------------------------------------------- */
  /*  Error: unknown pipeline                                          */
  /* ---------------------------------------------------------------- */

  if (!pipeline) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <XCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Pipeline Not Found</h2>
            <p className="text-muted-foreground">
              No pipeline exists with the name &ldquo;{pipelineName}&rdquo;.
            </p>
            <Button variant="outline" asChild>
              <Link href="/pipelines">
                <ArrowLeft className="h-4 w-4" />
                Back to Pipelines
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Determine summary state                                          */
  /* ---------------------------------------------------------------- */

  const isIdle = status === "idle";
  const isRunning = status === "running";
  const isFinished =
    status === "completed" || status === "failed" || status === "partial";

  const completedCount = stepStates.filter(
    (s) => s.status === "completed"
  ).length;
  const failedCount = stepStates.filter((s) => s.status === "failed").length;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/pipelines"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Pipelines
            </Link>
            <span>/</span>
            <span className="text-foreground">{pipeline.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <GitBranch className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight gradient-text">
              {pipeline.name}
            </h1>
          </div>
          <p className="text-muted-foreground">{pipeline.description}</p>
        </div>
      </div>

      {/* React Flow Canvas */}
      <Card className="overflow-hidden">
        <div className="h-[260px] w-full bg-[var(--os-window)] md:h-[300px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25, minZoom: 0.65, maxZoom: 1.2 }}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
          >
            <Background color="rgba(116, 102, 84, 0.2)" gap={26} size={1} />
          </ReactFlow>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {isRunning ? (
          <Button variant="destructive" onClick={cancel}>
            <Square className="h-4 w-4" />
            Cancel
          </Button>
        ) : (
          <Button onClick={handleRun} disabled={isRunning}>
            <Play className="h-4 w-4" />
            {isFinished ? "Run Again" : "Run Pipeline"}
          </Button>
        )}

        {isRunning && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Running step {currentStepIndex + 1} of {stepStates.length}...
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-4">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Pipeline Error
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Progress */}
      {!isIdle && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Step Progress</h2>
          <div className="space-y-2">
            {stepStates.map((step, i) => (
              <StepOutput key={step.skill} step={step} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {isFinished && (
        <>
          <Separator />
          <Card
            className={cn(
              status === "completed" && "border-green/30",
              status === "failed" && "border-destructive/30",
              status === "partial" && "border-warning/30"
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {status === "completed" && (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green" />
                    Pipeline Completed
                  </>
                )}
                {status === "failed" && (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    Pipeline Failed
                  </>
                )}
                {status === "partial" && (
                  <>
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Pipeline Partially Completed
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  {completedCount} of {stepStates.length} steps completed
                </span>
                {failedCount > 0 && (
                  <Badge variant="destructive">
                    {failedCount} failed
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
