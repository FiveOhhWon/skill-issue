"use client";

import Link from "next/link";
import { GitBranch, Play, ArrowRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PIPELINES, type PipelineStep } from "@/lib/pipelines";

/* ------------------------------------------------------------------ */
/*  Step chain visualization                                           */
/* ------------------------------------------------------------------ */

function StepChain({ steps }: { steps: PipelineStep[] }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.skill} className="flex items-center">
          {/* Node */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            </div>
            <span className="max-w-[100px] text-center text-[10px] leading-tight text-muted-foreground">
              {step.label}
            </span>
          </div>

          {/* Connector line */}
          {i < steps.length - 1 && (
            <div className="mx-1 mt-[-18px] h-px w-8 bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function PipelinesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <GitBranch className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight gradient-text">
            Pipelines
          </h1>
        </div>
        <p className="text-muted-foreground">
          Multi-step AI pipelines that chain skills together for complex
          workflows.
        </p>
      </div>

      {/* Pipeline Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(PIPELINES).map(([key, pipeline]) => (
          <Card
            key={key}
            className="group flex flex-col transition-all duration-200 hover:border-primary/30 hover:bg-card-hover"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary">
                  {pipeline.steps.length} steps
                </Badge>
              </div>
              <CardTitle className="mt-3 text-base">{pipeline.name}</CardTitle>
              <CardDescription>{pipeline.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
              <StepChain steps={pipeline.steps} />
            </CardContent>

            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/pipelines/${key}/run`}>
                  <Play className="h-4 w-4" />
                  Run Pipeline
                  <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
