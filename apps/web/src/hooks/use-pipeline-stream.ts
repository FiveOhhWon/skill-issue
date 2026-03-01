"use client";

import { useState, useCallback, useRef } from "react";

export type PipelineStatus = "idle" | "running" | "completed" | "failed" | "partial";

export interface PipelineStepState {
  skill: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  output?: unknown;
  error?: string;
}

interface UsePipelineStreamReturn {
  status: PipelineStatus;
  steps: PipelineStepState[];
  currentStepIndex: number;
  runId: string | null;
  error: string | null;
  run: (pipeline: string, input?: Record<string, unknown>) => void;
  cancel: () => void;
}

export function usePipelineStream(
  sessionId?: string
): UsePipelineStreamReturn {
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [steps, setSteps] = useState<PipelineStepState[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  const run = useCallback(
    async (pipeline: string, input?: Record<string, unknown>) => {
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      setStatus("running");
      setSteps([]);
      setCurrentStepIndex(-1);
      setRunId(null);
      setError(null);

      try {
        const res = await fetch("/api/pipelines/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipeline, input, sessionId }),
          signal: abort.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              switch (eventType) {
                case "status":
                  setRunId(data.runId);
                  if (data.steps) {
                    setSteps(data.steps);
                  }
                  break;
                case "step":
                  setSteps((prev) => {
                    const next = [...prev];
                    if (next[data.index]) {
                      next[data.index] = {
                        ...next[data.index],
                        status: data.status,
                        output: data.output,
                        error: data.error,
                      };
                    } else {
                      next[data.index] = data;
                    }
                    return next;
                  });
                  if (data.status === "running") {
                    setCurrentStepIndex(data.index);
                  }
                  break;
                case "progress":
                  // Mid-step progress updates
                  break;
                case "done":
                  setStatus(data.status === "partial" ? "partial" : "completed");
                  return;
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
        setStatus("failed");
      }
    },
    [sessionId]
  );

  return { status, steps, currentStepIndex, runId, error, run, cancel };
}
