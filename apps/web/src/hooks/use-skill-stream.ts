"use client";

import { useState, useCallback, useRef } from "react";

export type StreamStatus = "idle" | "running" | "completed" | "failed";

interface ProgressEvent {
  step: string;
  message: string;
}

interface UseSkillStreamReturn {
  status: StreamStatus;
  progress: ProgressEvent | null;
  result: unknown;
  error: string | null;
  runId: string | null;
  run: (skill: string, input?: Record<string, unknown>) => void;
  cancel: () => void;
}

export function useSkillStream(sessionId?: string): UseSkillStreamReturn {
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  const run = useCallback(
    async (skill: string, input?: Record<string, unknown>) => {
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      setStatus("running");
      setProgress(null);
      setResult(null);
      setError(null);
      setRunId(null);

      try {
        const res = await fetch("/api/skills/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skill, input, sessionId }),
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
                  break;
                case "progress":
                  setProgress(data);
                  break;
                case "result":
                  setResult(data.output);
                  setRunId(data.runId);
                  break;
                case "error":
                  setError(data.error);
                  setStatus("failed");
                  return;
                case "done":
                  setStatus("completed");
                  return;
              }
            }
          }
        }

        setStatus("completed");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
        setStatus("failed");
      }
    },
    [sessionId]
  );

  return { status, progress, result, error, runId, run, cancel };
}
