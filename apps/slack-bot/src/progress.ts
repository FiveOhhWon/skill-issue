import type { WebClient } from '@slack/web-api';
import type { PipelineProgressState, SlackBlock, StepStatus } from './types.js';

/** Minimum interval between chat.update calls (ms) */
const THROTTLE_MS = 1000;

/** Status emoji map */
const STATUS_EMOJI: Record<StepStatus, string> = {
  pending: ':white_circle:',
  active: ':hourglass_flowing_sand:',
  complete: ':white_check_mark:',
  failed: ':x:',
};

/** Active emoji for the main status line */
const STEP_EMOJI: Record<string, string> = {
  'content-research': ':mag:',
  'competitor-analysis': ':chart_with_upwards_trend:',
  'content-brief': ':memo:',
  'newsletter-analytics': ':bar_chart:',
  'sponsor-proposals': ':moneybag:',
  'performance-reports': ':clipboard:',
};

/**
 * Creates a new pipeline progress tracker.
 */
export function createProgressState(
  pipelineName: string,
  stepLabels: string[],
  channelId: string,
  messageTs: string,
): PipelineProgressState {
  return {
    pipelineName,
    steps: stepLabels.map((label) => ({
      label,
      status: 'pending' as StepStatus,
    })),
    currentStep: 0,
    totalSteps: stepLabels.length,
    channelId,
    messageTs,
  };
}

/**
 * Builds Block Kit blocks for the current progress state.
 */
export function buildProgressBlocks(state: PipelineProgressState): SlackBlock[] {
  const activeStep = state.steps[state.currentStep];
  const stepEmoji = activeStep
    ? STEP_EMOJI[activeStep.label.toLowerCase().replace(/\s+/g, '-')] ?? ':gear:'
    : ':gear:';

  const activeLabel = activeStep?.label ?? state.pipelineName;
  const statusText = activeStep?.status === 'active'
    ? `${stepEmoji} *${activeLabel}...* (${state.currentStep + 1}/${state.totalSteps})`
    : `:rocket: *Starting ${state.pipelineName}...*`;

  // Progress bar
  const progressBar = state.steps
    .map((s) => (s.status === 'complete' || s.status === 'active' ? ':black_large_square:' : ':white_large_square:'))
    .join('');

  // Step status line
  const stepStatusLine = state.steps
    .map((s) => `${STATUS_EMOJI[s.status]} ${s.label}`)
    .join(' | ');

  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: statusText },
    },
  ];

  // Only show progress bar if a step is active
  if (activeStep?.status === 'active') {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: progressBar },
    });
  }

  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: stepStatusLine }],
  });

  return blocks;
}

/**
 * Pipeline progress controller that manages state transitions and
 * throttled Slack message updates.
 */
export class PipelineProgress {
  private state: PipelineProgressState;
  private client: WebClient;
  private lastUpdateTime = 0;
  private pendingUpdate: ReturnType<typeof setTimeout> | null = null;

  constructor(client: WebClient, state: PipelineProgressState) {
    this.client = client;
    this.state = state;
  }

  /** Advances to the next step, marking current as complete and next as active. */
  async advanceStep(): Promise<void> {
    // Mark current step complete
    if (this.state.steps[this.state.currentStep]) {
      this.state.steps[this.state.currentStep].status = 'complete';
    }

    // Advance
    this.state.currentStep++;

    // Mark next step active
    if (this.state.currentStep < this.state.totalSteps) {
      this.state.steps[this.state.currentStep].status = 'active';
    }

    await this.throttledUpdate();
  }

  /** Starts the pipeline by marking the first step active. */
  async start(): Promise<void> {
    if (this.state.steps[0]) {
      this.state.steps[0].status = 'active';
    }
    await this.throttledUpdate();
  }

  /** Marks the current step as failed. */
  async fail(): Promise<void> {
    if (this.state.steps[this.state.currentStep]) {
      this.state.steps[this.state.currentStep].status = 'failed';
    }
    await this.throttledUpdate();
  }

  /** Returns current state (for use by caller). */
  getState(): PipelineProgressState {
    return this.state;
  }

  /** Replaces the progress message with final output blocks. */
  async complete(finalBlocks: SlackBlock[]): Promise<void> {
    if (this.pendingUpdate) {
      clearTimeout(this.pendingUpdate);
      this.pendingUpdate = null;
    }
    await this.client.chat.update({
      channel: this.state.channelId,
      ts: this.state.messageTs,
      blocks: finalBlocks as never[],
      text: 'Pipeline complete',
    });
  }

  /** Sends a throttled chat.update with current progress blocks. */
  private async throttledUpdate(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastUpdateTime;

    if (elapsed >= THROTTLE_MS) {
      await this.doUpdate();
    } else {
      // Schedule update after throttle window
      if (this.pendingUpdate) clearTimeout(this.pendingUpdate);
      this.pendingUpdate = setTimeout(() => {
        this.pendingUpdate = null;
        this.doUpdate();
      }, THROTTLE_MS - elapsed);
    }
  }

  private async doUpdate(): Promise<void> {
    this.lastUpdateTime = Date.now();
    const blocks = buildProgressBlocks(this.state);
    await this.client.chat.update({
      channel: this.state.channelId,
      ts: this.state.messageTs,
      blocks: blocks as never[],
      text: `Pipeline progress: ${this.state.currentStep + 1}/${this.state.totalSteps}`,
    });
  }
}
