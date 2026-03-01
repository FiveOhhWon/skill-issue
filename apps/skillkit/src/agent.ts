import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
const DEFAULT_MODEL = "haiku";
const SKILL_SETTING_SOURCES = ["user", "project"] as const;
const SKILLKIT_ALLOWED_TOOLS = [
  "Skill",
  "Read",
  "Write",
  "Edit",
  "Glob",
  "Grep",
  "WebSearch",
  "WebFetch",
] as const;

function findSkillkitCwd(): string {
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.cwd(), "../.."),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, ".claude", "skills"))) {
      return candidate;
    }
  }

  return process.cwd();
}

const SKILLKIT_CWD = findSkillkitCwd();

function extractResult(event: SDKMessage): string | null {
  if (event.type !== "result") return null;
  if (event.subtype !== "success") {
    const message =
      event.errors.length > 0 ? event.errors.join("; ") : "Agent execution failed";
    throw new Error(message);
  }
  return event.result;
}

function normalizeAgentError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Claude Code process exited with code 1")) {
    return new Error(
      [
        "Claude Agent SDK failed to start Claude Code.",
        "Verify Claude authentication (`claude auth status`) or set `ANTHROPIC_API_KEY`.",
        "If this process runs inside Claude Code/Codex, make sure `CLAUDECODE` is not inherited.",
      ].join(" "),
    );
  }
  return error instanceof Error ? error : new Error(message);
}

/**
 * Executes a single-turn prompt through the Claude Agent SDK and returns the
 * final assistant result string.
 */
export async function runAgentPrompt(
  prompt: string,
  systemPrompt: string,
): Promise<string> {
  const env = { ...process.env };
  delete env.CLAUDECODE;
  const stream = query({
    prompt,
    options: {
      cwd: SKILLKIT_CWD,
      maxTurns: 4,
      settingSources: [...SKILL_SETTING_SOURCES],
      allowedTools: [...SKILLKIT_ALLOWED_TOOLS],
      model: DEFAULT_MODEL,
      systemPrompt,
      permissionMode: "default",
      env,
    },
  });

  let result: string | null = null;
  try {
    for await (const event of stream) {
      const maybeResult = extractResult(event);
      if (maybeResult !== null) {
        result = maybeResult;
      }
    }
  } catch (error) {
    throw normalizeAgentError(error);
  }

  if (!result) {
    throw new Error("No result returned from Claude Agent SDK");
  }

  return result;
}
