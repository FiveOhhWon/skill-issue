import { parse as parseYaml } from "yaml";

export interface FrontmatterData {
  name?: string;
  version?: string;
  description?: string;
  tools?: string[];
  composable_with?: string[];
  [key: string]: unknown;
}

export interface ParsedSkillMd {
  frontmatter: FrontmatterData;
  body: string;
  yaml: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const KEBAB_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;

export function parseSkillMarkdown(raw: string): ParsedSkillMd {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: {}, body: raw.trim(), yaml: "" };
  }

  const yaml = match[1];
  const body = match[2].trim();

  let parsed: unknown = {};
  try {
    parsed = parseYaml(yaml) ?? {};
  } catch {
    parsed = {};
  }

  const frontmatter =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as FrontmatterData)
      : {};

  return { frontmatter, body, yaml };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateFrontmatter(frontmatter: FrontmatterData): ValidationResult {
  const errors: string[] = [];

  if (!frontmatter.name) {
    errors.push("name is required");
  } else if (!KEBAB_RE.test(String(frontmatter.name))) {
    errors.push("name must be kebab-case (e.g. my-skill-name)");
  }

  if (
    frontmatter.version !== undefined &&
    !SEMVER_RE.test(String(frontmatter.version))
  ) {
    errors.push("version must be semver (e.g. 1.0.0)");
  }

  if (!frontmatter.description || !String(frontmatter.description).trim()) {
    errors.push("description is required");
  }

  if (frontmatter.tools !== undefined && !Array.isArray(frontmatter.tools)) {
    errors.push("tools must be an array if present");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
