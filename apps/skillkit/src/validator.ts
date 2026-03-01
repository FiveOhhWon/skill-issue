/**
 * Programmatic validator for SKILL.md files.
 * Validates YAML frontmatter structure and required fields
 * without using AI -- pure TypeScript validation.
 */

import { parse as parseYaml } from "yaml";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_TOOLS = new Set([
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

const KEBAB_CASE_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;

/**
 * Extracts YAML frontmatter from a SKILL.md string.
 * Returns null if no valid frontmatter delimiters found.
 */
export function extractFrontmatter(
  content: string,
): { yaml: string; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  return { yaml: match[1], body: match[2] };
}

/**
 * Validates a SKILL.md string against the agentskills.io spec.
 */
export function validateSkillMd(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check frontmatter delimiters
  const extracted = extractFrontmatter(content);
  if (!extracted) {
    errors.push(
      "Missing or malformed YAML frontmatter (must be between --- delimiters)",
    );
    return { valid: false, errors, warnings };
  }

  // Parse YAML
  let frontmatter: Record<string, unknown>;
  try {
    frontmatter = parseYaml(extracted.yaml);
  } catch (e) {
    errors.push(
      `Invalid YAML in frontmatter: ${e instanceof Error ? e.message : String(e)}`,
    );
    return { valid: false, errors, warnings };
  }

  if (!frontmatter || typeof frontmatter !== "object") {
    errors.push("Frontmatter must be a YAML object");
    return { valid: false, errors, warnings };
  }

  // Required fields
  if (typeof frontmatter.name !== "string" || !frontmatter.name) {
    errors.push("Missing required field: name");
  } else if (!KEBAB_CASE_RE.test(frontmatter.name)) {
    errors.push(
      `Field 'name' must be kebab-case (got: "${frontmatter.name}")`,
    );
  }

  if (
    typeof frontmatter.description !== "string" ||
    !frontmatter.description
  ) {
    errors.push("Missing required field: description");
  }

  // Optional fields
  if (frontmatter.version !== undefined) {
    if (typeof frontmatter.version !== "string" || !frontmatter.version) {
      errors.push("Field 'version' must be a non-empty string if present");
    } else if (!SEMVER_RE.test(frontmatter.version)) {
      errors.push(
        `Field 'version' must be semver x.y.z (got: "${frontmatter.version}")`,
      );
    }
  } else {
    warnings.push("Missing optional field: version");
  }

  if (frontmatter.tools !== undefined) {
    if (!Array.isArray(frontmatter.tools)) {
      errors.push("Field 'tools' must be an array if present");
    } else {
      for (const tool of frontmatter.tools) {
        if (typeof tool !== "string") {
          errors.push(`Invalid tool entry: ${String(tool)} (must be string)`);
          continue;
        }
        if (!VALID_TOOLS.has(tool)) {
          warnings.push(
            `Unknown tool: "${tool}" (not in standard Claude Code tool set)`,
          );
        }
      }
    }
  } else {
    warnings.push("Missing optional field: tools");
  }

  if (frontmatter.input_schema !== undefined) {
    if (
      typeof frontmatter.input_schema !== "object" ||
      frontmatter.input_schema === null ||
      Array.isArray(frontmatter.input_schema)
    ) {
      errors.push("Field 'input_schema' must be an object if present");
    }
  }

  if (frontmatter.output_schema !== undefined) {
    if (
      typeof frontmatter.output_schema !== "object" ||
      frontmatter.output_schema === null ||
      Array.isArray(frontmatter.output_schema)
    ) {
      errors.push("Field 'output_schema' must be an object if present");
    }
  }

  // Check markdown body sections
  const body = extracted.body;
  const requiredSections = ["Overview", "Usage", "Steps"];
  for (const section of requiredSections) {
    if (!body.includes(`## ${section}`)) {
      warnings.push(`Missing recommended section: ## ${section}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
