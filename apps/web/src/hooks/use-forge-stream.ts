"use client";

import { useState, useCallback, useEffect } from "react";

export type ForgeStage = "planning" | "writing" | "reviewing" | "validating";
export type ForgeStatus = "idle" | "running" | "completed" | "failed";

interface ForgeProgress {
  stage: ForgeStage;
  message: string;
}

interface ForgeResult {
  skillMd: string;
  plan: unknown;
  review: { pass: boolean; issues: string[]; suggestions: string[] };
  validation: { valid: boolean; errors: string[]; warnings: string[] };
}

interface LastRequest {
  name: string;
  description: string;
}

interface UseForgeStreamReturn {
  status: ForgeStatus;
  currentStage: ForgeStage | null;
  progress: ForgeProgress[];
  result: ForgeResult | null;
  error: string | null;
  runId: string | null;
  lastRequest: LastRequest | null;
  run: (name: string, description: string) => void;
  cancel: () => void;
}

interface ForgeStoreState {
  status: ForgeStatus;
  currentStage: ForgeStage | null;
  progress: ForgeProgress[];
  result: ForgeResult | null;
  error: string | null;
  runId: string | null;
  lastRequest: LastRequest | null;
}

const STAGE_ORDER: ForgeStage[] = [
  "planning",
  "writing",
  "reviewing",
  "validating",
];

const INITIAL_STATE: ForgeStoreState = {
  status: "idle",
  currentStage: null,
  progress: [],
  result: null,
  error: null,
  runId: null,
  lastRequest: null,
};

let storeState: ForgeStoreState = { ...INITIAL_STATE };
let activeAbortController: AbortController | null = null;
const subscribers = new Set<(state: ForgeStoreState) => void>();

function emitStore() {
  for (const subscriber of subscribers) {
    subscriber(storeState);
  }
}

function updateStore(partial: Partial<ForgeStoreState>) {
  storeState = { ...storeState, ...partial };
  emitStore();
}

export function useForgeStream(): UseForgeStreamReturn {
  const [state, setState] = useState<ForgeStoreState>(storeState);

  useEffect(() => {
    const handler = (nextState: ForgeStoreState) => setState(nextState);
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }, []);

  const cancel = useCallback(() => {
    activeAbortController?.abort();
    activeAbortController = null;
    updateStore({ status: "idle" });
  }, []);

  const run = useCallback(async (name: string, description: string) => {
    activeAbortController?.abort();
    const abort = new AbortController();
    activeAbortController = abort;

    updateStore({
      status: "running",
      currentStage: null,
      progress: [],
      result: null,
      error: null,
      runId: null,
      lastRequest: { name, description },
    });

    try {
      const res = await fetch("/api/builder/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
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
                if (data.runId) {
                  updateStore({ runId: String(data.runId) });
                }
                break;
              case "progress": {
                const p = data as ForgeProgress;
                const prevProgress = storeState.progress;
                updateStore({
                  currentStage: p.stage,
                  progress: [...prevProgress, p],
                });
                break;
              }
              case "result":
                updateStore({ result: data.output as ForgeResult });
                break;
              case "error":
                updateStore({
                  error: String(data.error),
                  status: "failed",
                });
                return;
              case "done":
                updateStore({ status: "completed" });
                return;
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      updateStore({
        error: (err as Error).message,
        status: "failed",
      });
    } finally {
      if (activeAbortController === abort) {
        activeAbortController = null;
      }
    }
  }, []);

  return {
    status: state.status,
    currentStage: state.currentStage,
    progress: state.progress,
    result: state.result,
    error: state.error,
    runId: state.runId,
    lastRequest: state.lastRequest,
    run,
    cancel,
  };
}

export { STAGE_ORDER };
