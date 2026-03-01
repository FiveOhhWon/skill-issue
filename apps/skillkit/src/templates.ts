/**
 * SKILL.md template scaffolding with placeholders.
 */

import { stringify as stringifyYaml } from "yaml";

export interface SkillTemplateData {
  name: string;
  version: string;
  description: string;
  tools: string[];
  input_schema: Record<string, string>;
  output_schema: Record<string, string>;
}

/**
 * Generates YAML frontmatter from skill data.
 */
export function generateFrontmatter(data: SkillTemplateData): string {
  const yaml = stringifyYaml({
    name: data.name,
    version: data.version,
    description: data.description,
    tools: data.tools,
    input_schema: data.input_schema,
    output_schema: data.output_schema,
  }).trimEnd();

  return `---\n${yaml}\n---`;
}

/**
 * Generates a skeleton SKILL.md body with placeholder content.
 */
export function generateSkeletonBody(data: SkillTemplateData): string {
  const inputTable = Object.entries(data.input_schema)
    .map(([key, type]) => `| \`${key}\` | ${type} | |`)
    .join("\n");

  const outputTable = Object.entries(data.output_schema)
    .map(([key, type]) => `| \`${key}\` | ${type} | |`)
    .join("\n");

  return `
## Overview

${data.description}

## Usage

Ask the orchestrator: "Run ${data.name} with the appropriate parameters."

## Steps

1. Parse and validate input parameters
2. Execute the core skill logic
3. Format and return results

## Input

| Field | Type | Description |
|-------|------|-------------|
${inputTable}

## Output

| Field | Type | Description |
|-------|------|-------------|
${outputTable}

## Composability

This skill can be composed with other skills in the skill-issue pipeline.
`;
}

/**
 * Generates a complete SKILL.md from template data.
 */
export function generateSkillMd(data: SkillTemplateData): string {
  return generateFrontmatter(data) + "\n" + generateSkeletonBody(data);
}
