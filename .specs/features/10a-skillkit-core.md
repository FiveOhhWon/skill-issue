# Feature: Skillkit Core (Generative Skill Builder CLI)
## Status
pending
## Overview
CLI tool that generates new agentskills.io-compliant skills from natural language descriptions. Uses Agent SDK with multi-agent orchestration (planner, writer, reviewer).
## Requirements
- [REQ-1]: `cli.ts` must provide a commander-based CLI entry point with `--describe` and `--name` flags
- [REQ-2]: `forge.ts` must orchestrate the skill generation pipeline using Agent SDK `query()`
- [REQ-3]: `planner.ts` must act as a planner subagent that designs skill structure from a natural language description
- [REQ-4]: `writer.ts` must act as a writer subagent that generates SKILL.md + any supporting scripts
- [REQ-5]: `reviewer.ts` must act as a reviewer subagent that validates agentskills.io compliance
- [REQ-6]: `validator.ts` must perform programmatic validation of generated skills against agentskills.io spec
- [REQ-7]: `prompts.ts` must contain system prompts for each subagent (planner, writer, reviewer)
- [REQ-8]: `templates.ts` must provide SKILL.md scaffolding templates
- [REQ-9]: Generated skills must be fully compliant with agentskills.io standard (valid YAML frontmatter, proper structure)
## Acceptance Criteria
- [ ] [AC-1]: Running `npx skillkit --describe "Track social media mentions" --name influence-tracker` produces a valid SKILL.md
- [ ] [AC-2]: Generated SKILL.md has valid YAML frontmatter with name, description, version, and tools fields
- [ ] [AC-3]: Planner stage produces a skill structure plan (tools needed, input/output schema, composability notes)
- [ ] [AC-4]: Writer stage produces complete SKILL.md content based on the plan
- [ ] [AC-5]: Reviewer stage validates the generated skill and reports compliance status
- [ ] [AC-6]: Validator programmatically checks YAML frontmatter fields and SKILL.md structure
- [ ] [AC-7]: CLI provides clear progress output showing each stage (Planning -> Writing -> Reviewing)
- [ ] [AC-8]: Generated skills are placed in the correct directory structure
## Technical Approach
### Files to Create
- `apps/skillkit/src/cli.ts` - Commander CLI entry point with --describe, --name, --output-dir flags
- `apps/skillkit/src/forge.ts` - Orchestrator using Agent SDK query() to coordinate planner -> writer -> reviewer pipeline
- `apps/skillkit/src/planner.ts` - Planner subagent: analyzes description, determines tools, designs schema, plans structure
- `apps/skillkit/src/writer.ts` - Writer subagent: generates complete SKILL.md from plan
- `apps/skillkit/src/reviewer.ts` - Reviewer subagent: validates agentskills.io compliance, suggests improvements
- `apps/skillkit/src/validator.ts` - Programmatic YAML frontmatter validator and structure checker
- `apps/skillkit/src/prompts.ts` - System prompts for planner, writer, and reviewer agents
- `apps/skillkit/src/templates.ts` - SKILL.md template scaffolding with placeholders
### Files to Modify
- `apps/skillkit/package.json` - Add dependencies: commander, @anthropic-ai/claude-agent-sdk, yaml, @skill-issue/shared
- `apps/skillkit/tsconfig.json` - Ensure correct settings for CLI build
### Architecture Notes
- Three-agent pipeline: planner -> writer -> reviewer (sequential, each builds on previous output)
- Each agent is invoked via Agent SDK `query()` with specific system prompts from `prompts.ts`
- Planner output: JSON with skill name, description, tools list, input schema, output schema, composability targets
- Writer input: planner output + template from `templates.ts`; output: complete SKILL.md content
- Reviewer input: generated SKILL.md; output: compliance report with pass/fail and suggestions
- Validator is programmatic (not AI): parses YAML frontmatter, checks required fields, validates structure
- CLI uses commander for argument parsing; supports `--describe`, `--name`, `--output-dir` (default: `./plugin/skills/{name}/`)
- The CLI is standalone -- it does NOT depend on the Slack bot
## Dependencies
- Depends on: 01
- Blocks: 10b, 12
## Testing
### Unit Tests
- CLI argument parsing handles all flag combinations
- Validator correctly identifies valid and invalid YAML frontmatter
- Templates produce well-formed SKILL.md scaffolding
- Each system prompt is non-empty and role-appropriate
### Integration Tests
- End-to-end: CLI invocation -> planner -> writer -> reviewer -> valid SKILL.md output
- Generated skill passes validator checks
- Generated skill is discoverable by plugin manifest
## Estimated Complexity
high
