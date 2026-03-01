# Skillkit Generation Example

Demonstrates generating new agentskills.io-compliant skills from natural language descriptions using the Skillkit CLI or Slack bot.

## Via CLI

```bash
npx skillkit --describe "Track newsletter influence across social media platforms" --name influence-tracker
```

### CLI Output

```
Skillkit: Generating skill "influence-tracker"

> Planning
  Writing
  Reviewing
  Validating

  Designing skill structure...

  Planning [done]
> Writing
  Reviewing
  Validating

  Writing skill definition...

  Planning [done]
  Writing [done]
> Reviewing
  Validating

  Validating agentskills.io compliance...

--- Generation Complete ---

Skill written to: ./plugin/skills/influence-tracker/SKILL.md
Review: PASSED
Validation: PASSED
```

### CLI Flags

| Flag | Required | Description |
|------|----------|-------------|
| `--describe` | Yes | Natural language description of the skill |
| `--name` | Yes | Kebab-case skill name |
| `--output-dir` | No | Output directory (default: `./plugin/skills`) |

## Via Slack

```
@newsletter-bot Create a skill that monitors competitor pricing changes
```

The bot will show a multi-step flow:
1. Planning (designing skill structure)
2. Writing (generating SKILL.md)
3. Reviewing (validating compliance)
4. Result with preview and action buttons

### Slack Output

The final message includes:
- Skill name and description
- Tools used
- Composability targets
- YAML frontmatter preview in a code block
- Action buttons: "Use Now", "Edit Skill", "View Full SKILL.md"

## How It Works

Skillkit uses a three-agent pipeline:

1. **Planner** -- Analyzes the description and designs the skill structure (tools, schemas, steps)
2. **Writer** -- Generates a complete SKILL.md from the plan
3. **Reviewer** -- Validates agentskills.io compliance and reports issues

Each agent is invoked via the Claude Code Agent SDK `query()` function with specialized system prompts.

After the AI pipeline, a **programmatic validator** checks:
- YAML frontmatter syntax
- Required fields (name, version, description, tools)
- Kebab-case naming
- Semver versioning
- Valid tool names

## Example Generated Skills

### influence-tracker
```yaml
---
name: influence-tracker
version: 1.0.0
description: Track newsletter influence across social platforms
tools:
  - WebSearch
  - WebFetch
input_schema:
  newsletter_name: string
  time_window: string
  platforms: string[]
output_schema:
  influence_score: number
  mentions: object[]
  sentiment: object
  top_amplifiers: object[]
---
```

### pricing-monitor
```yaml
---
name: pricing-monitor
version: 1.0.0
description: Monitor competitor newsletter pricing and sponsorship rate changes
tools:
  - WebSearch
  - WebFetch
  - Read
input_schema:
  competitors: string[]
  check_frequency: string
output_schema:
  pricing_changes: object[]
  market_summary: string
---
```
