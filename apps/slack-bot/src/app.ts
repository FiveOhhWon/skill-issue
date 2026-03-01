import { App, Assistant } from '@slack/bolt';
import { query } from '@anthropic-ai/claude-agent-sdk';
import {
  buildQueryConfig,
  getOrCreateSession,
  extractSessionId,
} from './claude-handler.js';
import {
  markdownToMrkdwn,
  splitSectionText,
  chunkBlocks,
  makeFallbackText,
  buildSkillErrorBlocks,
  buildOnboardingBlocks,
} from './formatters.js';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

const PROCESSING_BLOCKS = [
  {
    type: 'section',
    text: { type: 'mrkdwn', text: ':gear: *Processing your request...*' },
  },
] as const;

const ASSISTANT_PROMPTS = [
  {
    title: 'Run Content Pipeline',
    message: 'Run a content pipeline for this week and return the top newsletter brief ideas.',
  },
  {
    title: 'Generate Sponsor Proposal',
    message: 'Generate a sponsor proposal using my latest newsletter analytics data.',
  },
  {
    title: 'Performance Report',
    message: 'Build a weekly performance report with highlights, anomalies, and recommended actions.',
  },
  {
    title: 'Competitor Coverage',
    message: 'Analyze competitor newsletters and identify topic gaps I should cover.',
  },
] as const;

function parseJsonLoose(input: string): unknown | null {
  const trimmed = input.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // ignore
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (!fenced) return null;
  try {
    return JSON.parse(fenced[1].trim());
  } catch {
    return null;
  }
}

function parseResult(resultText: string, structuredOutput?: unknown): unknown {
  if (structuredOutput !== undefined) return structuredOutput;
  return parseJsonLoose(resultText) ?? resultText;
}

function normalizeAgentError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Claude Code process exited with code 1')) {
    return new Error(
      [
        'Claude Agent SDK failed to start Claude Code.',
        'Verify Claude authentication (`claude auth status`) or set `ANTHROPIC_API_KEY`.',
        'If this process runs inside Claude Code/Codex, make sure `CLAUDECODE` is not inherited.',
      ].join(' '),
    );
  }
  return error instanceof Error ? error : new Error(message);
}

function formatOutputForSlack(output: unknown): string {
  if (typeof output === 'string') {
    return markdownToMrkdwn(output);
  }
  return `\`\`\`json\n${JSON.stringify(output, null, 2)}\n\`\`\``;
}

async function runAgentPrompt(
  message: string,
  threadTs: string,
  channelId: string,
  isFollowUp: boolean,
  onProgress?: (progress: string) => Promise<void>,
): Promise<{ output: unknown; sessionId: string }> {
  const session = getOrCreateSession(threadTs, channelId);
  const config = buildQueryConfig(message, session, isFollowUp);

  let resultText: string | null = null;
  let structuredOutput: unknown;
  let sessionId = session.sessionId;

  try {
    for await (const event of query({ prompt: config.prompt, options: config.options })) {
      sessionId = event.session_id;
      extractSessionId({ sessionId }, threadTs, channelId);

      if (event.type === 'tool_progress') {
        await onProgress?.(`Running ${event.tool_name}...`);
      } else if (event.type === 'system' && event.subtype === 'task_progress') {
        await onProgress?.(event.description);
      } else if (event.type === 'result') {
        if (event.subtype !== 'success') {
          const errorMessage =
            event.errors.length > 0 ? event.errors.join('; ') : `Query failed: ${event.subtype}`;
          throw new Error(errorMessage);
        }
        resultText = event.result;
        structuredOutput = event.structured_output;
      }
    }
  } catch (error) {
    throw normalizeAgentError(error);
  }

  if (!resultText) {
    throw new Error('No result returned from Claude Agent SDK');
  }

  return {
    output: parseResult(resultText, structuredOutput),
    sessionId,
  };
}

async function safeSetStatus(
  setStatus: (status: string) => Promise<unknown>,
  status: string,
): Promise<void> {
  try {
    await setStatus(status);
  } catch (error) {
    app.logger.warn(
      `assistant.threads.setStatus failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function handleIncomingMessage(
  text: string,
  channelId: string,
  threadTs: string,
  isFollowUp: boolean,
  updateMessage: (text: string, blocks?: unknown[]) => Promise<void>,
): Promise<void> {
  const output = await runAgentPrompt(
    text,
    threadTs,
    channelId,
    isFollowUp,
    async (progress) => {
      await updateMessage(`Processing: ${progress}`);
    },
  );

  const bodyText = formatOutputForSlack(output.output);
  const blocks = splitSectionText(bodyText);
  const chunked = chunkBlocks(blocks);

  await updateMessage(makeFallbackText(bodyText), chunked.primary as unknown[]);

  if (chunked.thread.length > 0) {
    await app.client.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      blocks: chunked.thread as never[],
      text: 'Continued results...',
    });
  }
}

async function handleLegacyMessage(
  text: string,
  channelId: string,
  threadTs: string,
  isFollowUp: boolean,
  client: App['client'],
): Promise<void> {
  const initialMsg = await client.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
    text: 'Processing your request...',
    blocks: PROCESSING_BLOCKS as unknown as never[],
  });

  try {
    await handleIncomingMessage(
      text,
      channelId,
      threadTs,
      isFollowUp,
      async (messageText, blocks) => {
        await client.chat.update({
          channel: channelId,
          ts: initialMsg.ts!,
          text: messageText,
          ...(blocks ? { blocks: blocks as never[] } : {}),
        });
      },
    );
  } catch (error) {
    const session = getOrCreateSession(threadTs, channelId);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await client.chat.update({
      channel: channelId,
      ts: initialMsg.ts!,
      blocks: buildSkillErrorBlocks('query', 'EXECUTION_ERROR', errorMessage, session.sessionId) as never[],
      text: `Error: ${errorMessage}`,
    });
  }
}

app.assistant(
  new Assistant({
    threadStarted: async ({ say, setSuggestedPrompts, setTitle, setStatus }) => {
      await safeSetStatus(setStatus, 'Ready');
      await setTitle('Newsletter Ops Chat');
      await setSuggestedPrompts({
        title: 'Try one of these',
        prompts: [...ASSISTANT_PROMPTS],
      });
      await say({
        blocks: buildOnboardingBlocks() as never[],
        text: 'Welcome to Newsletter Ops Bot! Ask for research, briefs, proposals, or reports.',
      });
      await safeSetStatus(setStatus, '');
    },
    threadContextChanged: async ({ saveThreadContext }) => {
      await saveThreadContext();
    },
    userMessage: async ({ event, say, setStatus }) => {
      const evt = event as unknown as Record<string, unknown>;
      const text = typeof evt.text === 'string' ? evt.text.trim() : '';
      if (!text) return;

      const channelId = typeof evt.channel === 'string' ? evt.channel : '';
      const threadTs = typeof evt.thread_ts === 'string' ? evt.thread_ts : '';
      if (!channelId || !threadTs) {
        app.logger.warn('Assistant userMessage missing channel/thread context');
        return;
      }

      if (text.toLowerCase() === 'help') {
        await safeSetStatus(setStatus, '');
        await say({
          blocks: buildOnboardingBlocks() as never[],
          text: 'Welcome to Newsletter Ops Bot!',
        });
        return;
      }

      await safeSetStatus(setStatus, 'Thinking…');

      try {
        await handleIncomingMessage(
          text,
          channelId,
          threadTs,
          true,
          async (messageText, blocks) => {
            if (!blocks) {
              const statusText = messageText.startsWith('Processing:')
                ? messageText.replace(/^Processing:\s*/, '').slice(0, 90)
                : 'Working...';
              await safeSetStatus(setStatus, statusText);
              return;
            }

            await say({
              text: messageText,
              blocks: blocks as never[],
            });
          },
        );
      } catch (error) {
        const session = getOrCreateSession(threadTs, channelId);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorBlocks = buildSkillErrorBlocks(
          'query',
          'EXECUTION_ERROR',
          errorMessage,
          session.sessionId,
        ) as never[];

        await say({
          blocks: errorBlocks,
          text: `Error: ${errorMessage}`,
        });
      } finally {
        await safeSetStatus(setStatus, '');
      }
    },
  }),
);

app.event('app_mention', async ({ event, client }) => {
  const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
  const threadTs = event.thread_ts ?? event.ts;
  const channelId = event.channel;

  if (text.toLowerCase() === 'help' || text === '') {
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      blocks: buildOnboardingBlocks() as never[],
      text: 'Welcome to Newsletter Ops Bot! Here are the available skills.',
    });
    return;
  }

  await handleLegacyMessage(
    text,
    channelId,
    threadTs,
    event.thread_ts !== undefined,
    client,
  );
});

app.event('message', async ({ event, client }) => {
  const evt = event as unknown as Record<string, unknown>;
  if (evt.channel_type !== 'im') return;
  if (evt.subtype) return;
  if (typeof evt.text !== 'string' || evt.text.trim() === '') return;

  const text = evt.text.trim();
  const channelId = typeof evt.channel === 'string' ? evt.channel : '';
  const threadTs =
    typeof evt.thread_ts === 'string'
      ? evt.thread_ts
      : typeof evt.ts === 'string'
        ? evt.ts
        : '';
  if (!channelId || !threadTs) return;

  if (text.toLowerCase() === 'help') {
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      blocks: buildOnboardingBlocks() as never[],
      text: 'Welcome to Newsletter Ops Bot!',
    });
    return;
  }

  await handleLegacyMessage(
    text,
    channelId,
    threadTs,
    typeof evt.thread_ts === 'string',
    client,
  );
});

export async function start(): Promise<void> {
  await app.start();
  console.log('Newsletter Ops Bot is running (Socket Mode)');
}

export { app };
