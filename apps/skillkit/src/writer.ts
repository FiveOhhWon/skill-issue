/**
 * Writer subagent: generates a complete SKILL.md from a planner's output.
 */

import { WRITER_REPAIR_SYSTEM_PROMPT, WRITER_SYSTEM_PROMPT } from "./prompts.js";
import type { SkillPlan } from "./planner.js";
import type { ReviewResult } from "./reviewer.js";
import type { ValidationResult } from "./validator.js";
import { runAgentPrompt } from "./agent.js";

/**
 * Runs the writer agent to generate a complete SKILL.md.
 */
export async function runWriter(plan: SkillPlan): Promise<string> {
  const userPrompt = `Generate a complete SKILL.md from this plan:

${JSON.stringify(plan, null, 2)}`;

  const text = await runAgentPrompt(userPrompt, WRITER_SYSTEM_PROMPT);

  return text.trim();
}

/**
 * Runs the writer repair agent to revise an invalid SKILL.md.
 */
export async function runWriterRepair(params: {
  plan: SkillPlan;
  previousSkillMd: string;
  review: ReviewResult;
  validation: ValidationResult;
  attempt: number;
  maxAttempts: number;
}): Promise<string> {
  const userPrompt = `Repair this SKILL.md.

Attempt ${params.attempt} of ${params.maxAttempts}.

Plan:
${JSON.stringify(params.plan, null, 2)}

Reviewer feedback:
${JSON.stringify(params.review, null, 2)}

Validator feedback:
${JSON.stringify(params.validation, null, 2)}

Current SKILL.md:
${params.previousSkillMd}`;

  const text = await runAgentPrompt(userPrompt, WRITER_REPAIR_SYSTEM_PROMPT);

  return text.trim();
}
