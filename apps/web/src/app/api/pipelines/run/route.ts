import { PIPELINES, type PipelineName } from "@/lib/skills";
import { buildQueryConfig, runAgentQuery } from "@/lib/agent";
import { addRun, updateRun, type StepRecord } from "@/lib/history";

function isAgentStartupFailure(message: string): boolean {
  return (
    message.includes("failed to start Claude Code") ||
    message.includes("Claude Code process exited with code 1")
  );
}

export async function POST(request: Request) {
  const { pipeline, input, sessionId } = await request.json();
  const pipelineDef = PIPELINES[pipeline as PipelineName];

  if (!pipelineDef) {
    return new Response(JSON.stringify({ error: "Unknown pipeline" }), {
      status: 400,
    });
  }

  const steps: StepRecord[] = pipelineDef.steps.map((s) => ({
    skill: s.skill,
    label: s.label,
    status: "pending" as const,
  }));

  const run = addRun({
    type: "pipeline",
    name: pipeline,
    status: "running",
    startedAt: new Date(),
    input,
    steps,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      send("status", {
        runId: run.id,
        pipeline,
        status: "running",
        steps: steps.map((s) => ({
          skill: s.skill,
          label: s.label,
          status: s.status,
        })),
      });

      let previousOutput: unknown = input;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        step.status = "running";
        send("step", {
          index: i,
          skill: step.skill,
          label: step.label,
          status: "running",
        });

        try {
          const prompt = `Run the "${step.skill}" skill. ${
            previousOutput
              ? `Previous pipeline step output: ${JSON.stringify(previousOutput)}`
              : ""
          }`;
          const execute = async (sid?: string) => {
            const config = buildQueryConfig(prompt, sid);
            return runAgentQuery(config, (message) => {
              send("progress", {
                index: i,
                message,
              });
            });
          };

          let result: unknown;
          try {
            ({ output: result } = await execute(sessionId));
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (sessionId && isAgentStartupFailure(message)) {
              send("progress", {
                index: i,
                message: "Agent startup failed; retrying with a fresh session...",
              });
              ({ output: result } = await execute(undefined));
            } else {
              throw error;
            }
          }

          step.status = "completed";
          step.output = result;
          previousOutput = result;

          send("step", {
            index: i,
            skill: step.skill,
            label: step.label,
            status: "completed",
            output: result,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          step.status = "failed";
          step.error = message;

          send("step", {
            index: i,
            skill: step.skill,
            label: step.label,
            status: "failed",
            error: message,
          });

          updateRun(run.id, {
            status: "partial",
            completedAt: new Date(),
            steps,
            error: `Failed at step: ${step.label}`,
          });

          send("done", { runId: run.id, status: "partial" });
          controller.close();
          return;
        }
      }

      updateRun(run.id, {
        status: "completed",
        completedAt: new Date(),
        steps,
        output: previousOutput,
      });

      send("done", { runId: run.id, status: "completed" });
      controller.close();
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
