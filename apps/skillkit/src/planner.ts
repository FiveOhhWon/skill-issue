/**
 * Planner subagent: analyzes a natural language description
 * and produces a structured skill plan (tools, schemas, steps).
 */

import { PLANNER_SYSTEM_PROMPT } from "./prompts.js";
import { runAgentPrompt } from "./agent.js";

export interface SkillPlan {
  name: string;
  description: string;
  version: string;
  tools: string[];
  input_schema: Record<string, string>;
  output_schema: Record<string, string>;
  composable_with: string[];
  steps: string[];
}

/**
 * Runs the planner agent to generate a skill structure plan.
 */
export async function runPlanner(
  skillName: string,
  description: string,
): Promise<SkillPlan> {
  const userPrompt = `Design a skill with the following details:
- Name: ${skillName}
- Description: ${description}

Produce a JSON plan.`;

  const text = await runAgentPrompt(userPrompt, PLANNER_SYSTEM_PROMPT);

  // Parse JSON response
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const plan: SkillPlan = JSON.parse(cleaned);

  // Ensure the name matches what was requested
  plan.name = skillName;

  return plan;
}
