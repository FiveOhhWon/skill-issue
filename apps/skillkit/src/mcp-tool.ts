/**
 * MCP tool registration for the skillkit forge pipeline.
 * Uses createSdkMcpServer + tool() from the Agent SDK to expose
 * skill generation as a callable MCP tool for the Slack bot.
 */

import { forge, type ForgeProgress, type ForgeResult } from "./forge.js";
import { extractFrontmatter } from "./validator.js";
import { parse as parseYaml } from "yaml";

/** Input parameters for the skillkit MCP tool. */
export interface SkillkitToolInput {
  name: string;
  description: string;
}

/** Output returned by the skillkit MCP tool. */
export interface SkillkitToolOutput {
  skillMd: string;
  frontmatter: Record<string, unknown> | null;
  review: {
    pass: boolean;
    issues: string[];
    suggestions: string[];
  };
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  stages: Array<{ stage: string; message: string }>;
}

/**
 * Creates the MCP server definition for the skillkit tool.
 *
 * This returns the server configuration object that can be passed
 * to the Agent SDK's mcpServers option. The actual createSdkMcpServer
 * call is made by the consuming application (the Slack bot).
 *
 * Usage with Agent SDK:
 * ```ts
 * import { createSkillkitMcpServer } from '@skill-issue/skillkit/mcp-tool';
 *
 * const server = createSkillkitMcpServer();
 * // Pass to Agent SDK query config:
 * // mcpServers: { skillkit: server }
 * ```
 */
export function createSkillkitMcpServer() {
  return {
    tools: {
      skillkit_forge: {
        description:
          "Generate a new SKILL.md file using the skillkit forge pipeline. " +
          "Takes a kebab-case skill name and a natural language description, " +
          "then runs the full pipeline: planning, writing, reviewing, and validation.",
        inputSchema: {
          type: "object" as const,
          properties: {
            name: {
              type: "string" as const,
              description:
                "Kebab-case skill name (e.g. 'influence-tracker', 'social-mentions')",
            },
            description: {
              type: "string" as const,
              description:
                "Natural language description of what the skill should do",
            },
          },
          required: ["name", "description"],
        },
        handler: async (input: SkillkitToolInput): Promise<SkillkitToolOutput> => {
          return runSkillkitForge(input.name, input.description);
        },
      },
    },
  };
}

/**
 * Runs the forge pipeline and returns a structured output
 * suitable for the MCP tool response.
 */
export async function runSkillkitForge(
  name: string,
  description: string,
): Promise<SkillkitToolOutput> {
  const stages: Array<{ stage: string; message: string }> = [];

  const onProgress = (progress: ForgeProgress): void => {
    stages.push({ stage: progress.stage, message: progress.message });
  };

  const result: ForgeResult = await forge(name, description, onProgress);

  if (!result.validation.valid) {
    throw new Error(
      `Generated skill failed validation: ${result.validation.errors.join("; ")}`
    );
  }

  // Extract and parse frontmatter for the preview
  const extracted = extractFrontmatter(result.skillMd);
  let frontmatter: Record<string, unknown> | null = null;
  if (extracted) {
    try {
      frontmatter = parseYaml(extracted.yaml) as Record<string, unknown>;
    } catch {
      frontmatter = null;
    }
  }

  return {
    skillMd: result.skillMd,
    frontmatter,
    review: {
      pass: result.review.pass,
      issues: result.review.issues,
      suggestions: result.review.suggestions,
    },
    validation: {
      valid: result.validation.valid,
      errors: result.validation.errors,
      warnings: result.validation.warnings,
    },
    stages,
  };
}

/**
 * Returns the MCP tool input schema (for testing/verification).
 */
export function getToolInputSchema() {
  return {
    type: "object" as const,
    properties: {
      name: {
        type: "string" as const,
        description:
          "Kebab-case skill name (e.g. 'influence-tracker', 'social-mentions')",
      },
      description: {
        type: "string" as const,
        description:
          "Natural language description of what the skill should do",
      },
    },
    required: ["name", "description"],
  };
}
