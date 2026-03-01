import { addRun, updateRun } from "@/lib/history";
import { saveSkill } from "@/lib/skills";
import type { ForgeProgress } from "@skill-issue/skillkit";

export async function POST(request: Request) {
  const { name, description } = await request.json();

  if (!name || !description) {
    return new Response(
      JSON.stringify({ error: "name and description required" }),
      { status: 400 }
    );
  }

  const run = addRun({
    type: "builder",
    name,
    status: "running",
    startedAt: new Date(),
    input: { name, description },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      send("status", { runId: run.id, status: "running" });

      try {
        const { forge } = await import("@skill-issue/skillkit");
        const forgeResult = await forge(name, description, (progress: ForgeProgress) => {
          send("progress", {
            stage: progress.stage,
            message: progress.message,
          });
        });

        if (!forgeResult.validation.valid) {
          throw new Error(
            `Generated skill failed validation: ${forgeResult.validation.errors.join("; ")}`
          );
        }

        await saveSkill(name, forgeResult.skillMd);

        send("result", { runId: run.id, output: forgeResult });
        updateRun(run.id, {
          status: "completed",
          completedAt: new Date(),
          output: forgeResult,
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
