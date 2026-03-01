# Skill Authoring Guide

This guide explains how to create new skills for the skill-issue platform following the agentskills.io standard.

## What Is a Skill?

A skill is a `SKILL.md` file that instructs Claude on how to perform a specific task. It contains:
- **YAML frontmatter** with metadata (name, version, tools, schemas)
- **Markdown body** with instructions, input/output specs, and workflow steps

## Quick Start

The fastest way to create a skill is with Skillkit:

```bash
npx skillkit --describe "Track social media mentions of newsletter content" --name influence-tracker
```

This generates a complete `SKILL.md` at `plugin/skills/influence-tracker/SKILL.md`.

## Manual Creation

### 1. Create the Directory

```bash
mkdir -p plugin/skills/my-skill
```

### 2. Write SKILL.md

```markdown
---
name: my-skill
description: >
  One-sentence description of what the skill does.
version: 1.0.0
tools:
  - WebSearch
  - Read
output_schema: MySkillOutput
---

# My Skill

You are a [role description]. Given [input description], you will [action].

## Input

Describe what the skill expects as input. Use a table:

| Field | Type | Description |
|-------|------|-------------|
| query | string | The search query |
| limit | number | Max results to return |

## Workflow

1. **Step One**: Description of first action
2. **Step Two**: Description of second action
3. **Step Three**: Description of third action

## Output Format

The output must be valid JSON conforming to the `MySkillOutput` schema.

## Composability

This skill can chain with:
- `content-research` (receives trending topics as input)
- `newsletter-analytics` (provides data for analysis)
```

### 3. YAML Frontmatter Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Kebab-case identifier (e.g., `my-skill`) |
| `version` | Yes | string | Semantic version (e.g., `1.0.0`) |
| `description` | Yes | string | One-sentence description |
| `tools` | Yes | string[] | Claude Code tools the skill needs |
| `output_schema` | No | string | Name of Zod schema in `@skill-issue/shared` |
| `input_schema` | No | object | Input field names and types |

### Available Tools

| Tool | Use Case |
|------|----------|
| `WebSearch` | Search the web for information |
| `WebFetch` | Fetch and parse web pages |
| `Read` | Read files from the filesystem |
| `Write` | Write files to the filesystem |
| `Edit` | Edit existing files |
| `Glob` | Find files by pattern |
| `Grep` | Search file contents |
| `Bash` | Run shell commands (excluded from Slack bot) |

### 4. Add Zod Schema (Optional)

If your skill has structured output that needs validation at the app boundary:

```typescript
// packages/shared/src/schemas/my-skill.ts
import { z } from 'zod';

export const MySkillOutputSchema = z.object({
  results: z.array(z.object({
    title: z.string(),
    score: z.number().min(0).max(100),
  })),
  generatedDate: z.string().datetime(),
});

export type MySkillOutput = z.infer<typeof MySkillOutputSchema>;
```

Then export it from `packages/shared/src/schemas/index.ts`.

### 5. Ensure Project Skill Discovery

Claude Agent SDK discovers project skills from `.claude/skills`.
In this repo, `.claude/skills` is a symlink to `plugin/skills`, so no
additional manifest registration is needed.

Just place your new `SKILL.md` under `plugin/skills/{name}/SKILL.md`.

## Writing Effective Skill Instructions

### Be Specific About the Role

The first line after the frontmatter should establish Claude's role:

```markdown
You are a newsletter analytics engine. Given a CSV file...
```

### Define Clear Steps

Use numbered steps in the Workflow section. Each step should be a distinct action:

```markdown
## Workflow

1. **Parse**: Read the input file and extract records
2. **Compute**: Calculate KPIs from the parsed data
3. **Detect**: Identify anomalies using z-scores
4. **Format**: Produce structured JSON output
```

### Specify Output Exactly

Be explicit about the output format. Include a JSON example:

```markdown
## Output Format

The output must be valid JSON:

{
  "topics": [
    {
      "title": "string",
      "relevanceScore": 0-100,
      "sources": ["url1", "url2"]
    }
  ]
}
```

### Support Scripts

For complex computation, you can include TypeScript scripts alongside the SKILL.md:

```
plugin/skills/newsletter-analytics/
  SKILL.md
  scripts/
    compute-kpis.ts
    detect-anomalies.ts
    parse-metrics.ts
    index.ts
```

Reference them in the workflow: "Run `scripts/compute-kpis.ts` on the parsed records."

## Composability Guidelines

### Input Compatibility

To receive output from another skill, describe what you expect as prompt context in the Input section. The orchestrator will forward the upstream skill's output.

### Output Compatibility

To feed into another skill, produce output that the downstream skill can interpret. JSON is preferred for structured data; Markdown for human-readable output.

### Declare Composability

In the Composability section, list which skills this one chains with:

```markdown
## Composability

This skill is part of the Content Pipeline:
- Receives: `content-research` output (trending topics JSON)
- Feeds into: `content-brief` (provides gap analysis for brief generation)
```

## Validation

Run the validator to check your SKILL.md:

```typescript
import { validateSkillMd } from '@skill-issue/skillkit';

const content = fs.readFileSync('plugin/skills/my-skill/SKILL.md', 'utf-8');
const result = validateSkillMd(content);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

The validator checks:
- YAML frontmatter is present and valid
- Required fields (name, version, description, tools) exist
- Name is kebab-case
- Version is semver
- Tools are valid Claude Code tool names
