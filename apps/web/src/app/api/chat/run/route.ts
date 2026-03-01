import { buildQueryConfig, runAgentQuery } from "@/lib/agent";
import { addRun, updateRun } from "@/lib/history";

function isAgentStartupFailure(message: string): boolean {
  return (
    message.includes("failed to start Claude Code") ||
    message.includes("Claude Code process exited with code 1")
  );
}

export async function POST(request: Request) {
  const { message, sessionId } = await request.json();

  const prompt = typeof message === "string" ? message.trim() : "";
  if (!prompt) {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const run = addRun({
    type: "chat",
    name: "chat",
    status: "running",
    startedAt: new Date(),
    input: { message: prompt },
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
        send("status", { runId: run.id, status: "running", type: "chat" });
        send("progress", {
          step: "initializing",
          message: "Thinking...",
        });

        const execute = async (sid?: string) => {
          const config = buildQueryConfig(prompt, sid);
          config.options.includePartialMessages = true;
          let fullText = "";
          return runAgentQuery(config, {
            onProgress: (msg) => {
              send("progress", { step: "executing", message: msg });
            },
            onTextChunk: (chunk) => {
              fullText += chunk;
              send("chunk", { text: chunk, fullText });
            },
          });
        };

        let output: unknown;
        try {
          ({ output } = await execute(sessionId));
        } catch (error) {
          const errMessage = error instanceof Error ? error.message : String(error);
          if (sessionId && isAgentStartupFailure(errMessage)) {
            send("progress", {
              step: "retrying",
              message: "Agent startup failed; retrying with a fresh session...",
            });
            ({ output } = await execute(undefined));
          } else {
            throw error;
          }
        }

        send("result", { runId: run.id, output });
        updateRun(run.id, {
          status: "completed",
          completedAt: new Date(),
          output,
        });
        send("done", { runId: run.id });
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Unknown error";
        send("error", { runId: run.id, error: errMessage });
        updateRun(run.id, {
          status: "failed",
          completedAt: new Date(),
          error: errMessage,
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
