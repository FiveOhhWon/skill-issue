/**
 * Forge: orchestrator for the skillkit generation pipeline.
 * Coordinates planner -> writer -> reviewer in sequence,
 * with programmatic validation and deterministic normalization.
 */

import { runPlanner, type SkillPlan } from "./planner.js";
import { runWriter } from "./writer.js";
import { runReviewer, type ReviewResult } from "./reviewer.js";
import { extractFrontmatter, validateSkillMd, type ValidationResult } from "./validator.js";
import { generateSkillMd, generateSkeletonBody, type SkillTemplateData } from "./templates.js";
import { stringify as stringifyYaml } from "yaml";

export type ForgeStage = "planning" | "writing" | "reviewing" | "validating";

export interface ForgeProgress {
  stage: ForgeStage;
  message: string;
}

export interface ForgeResult {
  skillMd: string;
  plan: SkillPlan;
  review: ReviewResult;
  validation: ValidationResult;
}

export class ForgeValidationError extends Error {
  readonly lastResult: ForgeResult;

  constructor(message: string, lastResult: ForgeResult) {
    super(message);
    this.name = "ForgeValidationError";
    this.lastResult = lastResult;
  }
}

const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const ALLOWED_TOOLS = new Set([
  "WebSearch",
  "WebFetch",
  "Bash",
  "Read",
  "Write",
  "Edit",
  "Glob",
  "Grep",
  "NotebookEdit",
]);
const DEFAULT_TOOLS = ["Read", "Write", "Edit"];

function normalizeSchema(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const normalized: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    const trimmedKey = key.trim();
    if (!trimmedKey) continue;
    if (typeof raw === "string" && raw.trim().length > 0) {
      normalized[trimmedKey] = raw.trim();
      continue;
    }
    if (typeof raw === "number" || typeof raw === "boolean") {
      normalized[trimmedKey] = String(raw);
    }
  }
  return normalized;
}

function normalizePlan(
  plan: SkillPlan,
  skillName: string,
  fallbackDescription: string,
): SkillPlan {
  const description =
    typeof plan.description === "string" && plan.description.trim().length > 0
      ? plan.description.trim()
      : fallbackDescription.trim() || `Skill for ${skillName}`;

  const version =
    typeof plan.version === "string" && SEMVER_RE.test(plan.version)
      ? plan.version
      : "1.0.0";

  const tools = Array.isArray(plan.tools)
    ? plan.tools.filter(
        (tool): tool is string =>
          typeof tool === "string" && ALLOWED_TOOLS.has(tool),
      )
    : [];

  const steps = Array.isArray(plan.steps)
    ? plan.steps.filter(
        (step): step is string =>
          typeof step === "string" && step.trim().length > 0,
      )
    : [];

  const composableWith = Array.isArray(plan.composable_with)
    ? plan.composable_with.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];

  return {
    name: skillName,
    description,
    version,
    tools: tools.length > 0 ? tools : DEFAULT_TOOLS,
    input_schema: normalizeSchema(plan.input_schema),
    output_schema: normalizeSchema(plan.output_schema),
    composable_with: composableWith,
    steps:
      steps.length > 0
        ? steps
        : [
            "Parse and validate the requested input values",
            "Execute the core skill workflow",
            "Return structured output that matches output_schema",
          ],
  };
}

function planToTemplateData(plan: SkillPlan): SkillTemplateData {
  return {
    name: plan.name,
    version: plan.version,
    description: plan.description,
    tools: plan.tools,
    input_schema: plan.input_schema,
    output_schema: plan.output_schema,
  };
}

function hasRecommendedSections(body: string): boolean {
  const sections = ["## Overview", "## Usage", "## Steps", "## Input", "## Output"];
  return sections.every((section) => body.includes(section));
}

function canonicalizeSkillMd(plan: SkillPlan, candidateSkillMd: string): string {
  const extracted = extractFrontmatter(candidateSkillMd);
  let body = (extracted ? extracted.body : candidateSkillMd).trim();
  const templateData = planToTemplateData(plan);

  if (!body || !hasRecommendedSections(body)) {
    body = generateSkeletonBody(templateData).trim();
  }

  const frontmatter: Record<string, unknown> = {
    name: plan.name,
    version: plan.version,
    description: plan.description,
    tools: plan.tools,
    input_schema: plan.input_schema,
    output_schema: plan.output_schema,
  };

  if (plan.composable_with.length > 0) {
    frontmatter.composable_with = plan.composable_with;
  }

  const yaml = stringifyYaml(frontmatter).trimEnd();
  return `---\n${yaml}\n---\n${body}\n`;
}

async function safeRunReviewer(skillMd: string): Promise<ReviewResult> {
  try {
    return await runReviewer(skillMd);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      pass: false,
      issues: [`Reviewer failed: ${message}`],
      suggestions: [],
    };
  }
}

/**
 * Runs the full skill generation pipeline.
 *
 * @param name - kebab-case skill name
 * @param description - natural language description
 * @param onProgress - optional callback for progress updates
 */
export async function forge(
  name: string,
  description: string,
  onProgress?: (progress: ForgeProgress) => void,
): Promise<ForgeResult> {
  // Stage 1: Planning
  onProgress?.({ stage: "planning", message: "Designing skill structure..." });
  const rawPlan = await runPlanner(name, description);
  const plan = normalizePlan(rawPlan, name, description);
  const templateData = planToTemplateData(plan);

  // Stage 2: Writing
  onProgress?.({
    stage: "writing",
    message: "Writing skill definition...",
  });
  let candidateSkillMd: string;
  try {
    candidateSkillMd = await runWriter(plan);
  } catch {
    onProgress?.({
      stage: "writing",
      message: "Writer failed, using deterministic template...",
    });
    candidateSkillMd = generateSkillMd(templateData);
  }

  const skillMd = canonicalizeSkillMd(plan, candidateSkillMd);

  // Stage 3: Reviewing
  onProgress?.({
    stage: "reviewing",
    message: "Reviewing skill for compliance...",
  });
  const review = await safeRunReviewer(skillMd);

  // Stage 4: Programmatic validation
  onProgress?.({
    stage: "validating",
    message: "Running programmatic checks...",
  });
  const validation = validateSkillMd(skillMd);

  const primaryResult: ForgeResult = {
    skillMd,
    plan,
    review,
    validation,
  };

  if (validation.valid) {
    return primaryResult;
  }

  // Deterministic fallback if canonicalized output still fails validation.
  onProgress?.({
    stage: "writing",
    message: "Validation failed, using strict deterministic fallback...",
  });
  const fallbackSkillMd = generateSkillMd(templateData);
  const fallbackReview = await safeRunReviewer(fallbackSkillMd);
  const fallbackValidation = validateSkillMd(fallbackSkillMd);

  const fallbackResult: ForgeResult = {
    skillMd: fallbackSkillMd,
    plan,
    review: fallbackReview,
    validation: fallbackValidation,
  };

  if (fallbackValidation.valid) return fallbackResult;

  throw new ForgeValidationError(
    `Failed to generate a valid SKILL.md after normalization and fallback: ${fallbackValidation.errors.join("; ")}`,
    fallbackResult,
  );
}
