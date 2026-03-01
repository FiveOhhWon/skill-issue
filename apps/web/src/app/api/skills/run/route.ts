import { buildQueryConfig, runAgentQuery } from "@/lib/agent";
import { addRun, updateRun } from "@/lib/history";

function isAgentStartupFailure(message: string): boolean {
  return (
    message.includes("failed to start Claude Code") ||
    message.includes("Claude Code process exited with code 1")
  );
}

export async function POST(request: Request) {
  const { skill, input, sessionId } = await request.json();

  const run = addRun({
    type: "skill",
    name: skill,
    status: "running",
    startedAt: new Date(),
    input,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        send("status", { runId: run.id, status: "running", skill });
        send("progress", {
          step: "initializing",
          message: `Running ${skill}...`,
        });

        const prompt = [
          `Use the Skill tool and run the "${skill}" skill.`,
          "Do not execute this request without invoking the Skill tool first.",
          `Skill input JSON: ${JSON.stringify(input || {})}`,
          "If the skill is unavailable, return a short error message explaining that the skill was not found.",
        ].join("\n");
        const execute = async (sid?: string) => {
          const config = buildQueryConfig(prompt, sid);
          return runAgentQuery(config, (message) => {
            send("progress", { step: "executing", message });
          });
        };

        let output: unknown;
        try {
          ({ output } = await execute(sessionId));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (sessionId && isAgentStartupFailure(message)) {
            send("progress", {
              step: "retrying",
              message: "Agent startup failed; retrying with a fresh session...",
            });
            ({ output } = await execute(undefined));
          } else {
            throw error;
          }
        }

        send("progress", { step: "complete", message: "Done" });
        send("result", { runId: run.id, output });
        updateRun(run.id, {
          status: "completed",
          completedAt: new Date(),
          output,
        });
        send("done", { runId: run.id });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        send("error", { runId: run.id, error: message });
        updateRun(run.id, {
          status: "failed",
          completedAt: new Date(),
          error: message,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
