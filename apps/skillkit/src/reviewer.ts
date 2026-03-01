/**
 * Reviewer subagent: validates agentskills.io compliance of a generated SKILL.md.
 */

import { REVIEWER_SYSTEM_PROMPT } from "./prompts.js";
import { runAgentPrompt } from "./agent.js";

export interface ReviewResult {
  pass: boolean;
  issues: string[];
  suggestions: string[];
}

/**
 * Runs the reviewer agent to validate a SKILL.md.
 */
export async function runReviewer(skillMd: string): Promise<ReviewResult> {
  const userPrompt = `Review this SKILL.md for agentskills.io compliance:

${skillMd}`;

  const text = await runAgentPrompt(userPrompt, REVIEWER_SYSTEM_PROMPT);

  // Parse JSON response
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const result: ReviewResult = JSON.parse(cleaned);

  return result;
}
