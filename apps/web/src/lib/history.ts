/**
 * In-memory run history store (100 records max, FIFO).
 */

export interface RunRecord {
  id: string;
  type: "chat" | "skill" | "pipeline" | "builder";
  name: string;
  status: "running" | "completed" | "failed" | "partial";
  startedAt: Date;
  completedAt?: Date;
  input?: Record<string, unknown>;
  output?: unknown;
  error?: string;
  /** For pipelines: per-step results */
  steps?: StepRecord[];
}

export interface StepRecord {
  skill: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  output?: unknown;
  error?: string;
}

const history: RunRecord[] = [];
const MAX_RECORDS = 100;

export function addRun(run: Omit<RunRecord, "id">): RunRecord {
  const record: RunRecord = { ...run, id: crypto.randomUUID() };
  history.unshift(record);
  if (history.length > MAX_RECORDS) history.pop();
  return record;
}

export function updateRun(
  id: string,
  update: Partial<RunRecord>
): RunRecord | null {
  const idx = history.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  history[idx] = { ...history[idx], ...update };
  return history[idx];
}

export function getRun(id: string): RunRecord | undefined {
  return history.find((r) => r.id === id);
}

export function listRuns(filters?: {
  type?: string;
  status?: string;
  name?: string;
  limit?: number;
}): RunRecord[] {
  let results = [...history];
  if (filters?.type) results = results.filter((r) => r.type === filters.type);
  if (filters?.status) results = results.filter((r) => r.status === filters.status);
  if (filters?.name)
    results = results.filter((r) =>
      r.name.toLowerCase().includes(filters.name!.toLowerCase())
    );
  if (filters?.limit) results = results.slice(0, filters.limit);
  return results;
}
