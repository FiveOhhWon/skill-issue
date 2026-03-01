import type { KnownBlock, Block } from '@slack/types';

/** Slack Block Kit block type alias */
export type SlackBlock = KnownBlock | Block;

/** Result of chunking blocks for Slack message limits */
export interface ChunkedBlocks {
  primary: SlackBlock[];
  thread: SlackBlock[];
}

/** Pipeline step status */
export type StepStatus = 'pending' | 'active' | 'complete' | 'failed';

/** A single step in a pipeline progress tracker */
export interface PipelineStepInfo {
  label: string;
  status: StepStatus;
  emoji?: string;
}

/** Full pipeline progress state */
export interface PipelineProgressState {
  pipelineName: string;
  steps: PipelineStepInfo[];
  currentStep: number;
  totalSteps: number;
  channelId: string;
  messageTs: string;
}

/** Session store entry for multi-turn conversations */
export interface SessionEntry {
  sessionId: string;
  threadTs: string;
  channelId: string;
  createdAt: number;
}

/** Supported skill output types for Block Kit formatting */
export type SkillOutputType =
  | 'content-research'
  | 'competitor-analysis'
  | 'content-brief'
  | 'newsletter-analytics'
  | 'sponsor-proposals'
  | 'performance-reports'
  | 'skillkit';
