# System Architecture Diagram

## FigJam URL

[skill-issue Platform Architecture](https://www.figma.com/online-whiteboard/create-diagram/4945723c-4502-4235-a617-e4d876287ff9?utm_source=other&utm_content=edit_in_figjam&oai_id=&request_id=9c73cf87-ae80-434e-860b-03a46ad0dcdd)

## Architecture Description

The skill-issue platform is a composable AI skills system for newsletter operations. The architecture is organized in four layers flowing left to right:

### User Surfaces (Entry Points)

Three surfaces expose the same underlying skill library to different user personas:

- **Claude Code Plugin** -- Technical users interact directly through Claude Code with the plugin installed. Skills are invoked via slash commands and agent orchestration.
- **Slack Bot** -- Non-technical users (editors, sales) access skills through natural language in Slack. Built with `@slack/bolt` in Socket Mode, secured with `acceptEdits` permission mode and scoped `allowedTools` (no Bash).
- **CLI / Skillkit** -- Power users and developers use the CLI to run skills directly or generate new skills from natural language descriptions.

### Core Layer (Orchestration)

- **Orchestrator Agent** (`plugin/agents/newsletter-ops.md`) -- Routes incoming requests to the appropriate skill pipeline. Reads one skill's output and feeds it as prompt context to the next skill (prompt-driven composition, not runtime JSON enforcement).
- **Plugin Skill Library** -- Six skills organized into three pipelines, all compliant with the agentskills.io standard. Each skill has a `SKILL.md` with YAML frontmatter.
- **Shared Types & Schemas (Zod)** -- `packages/shared` provides Zod schemas that validate data at the TypeScript application boundary (Slack bot, skillkit). Schemas do not enforce inter-skill contracts within Claude Code.

### Skill Pipelines (Data Flow)

Three composition pipelines, each showing how skills chain together:

1. **Content Pipeline**: `content-research` (discovers trending topics via WebSearch/WebFetch) -> `competitor-analysis` (identifies coverage gaps) -> `content-brief` (synthesizes ranked editorial briefs)
2. **Sponsor Pipeline**: `newsletter-analytics` (computes KPIs from CSV/JSON) -> `sponsor-proposals` (generates data-backed proposals with CPM tiers) -> HubSpot MCP (logs deals and notes to CRM)
3. **Reporting Pipeline**: `newsletter-analytics` (shared with sponsor pipeline) -> `performance-reports` (formats stakeholder-ready reports with period comparisons)

### External Integrations

- **HubSpot MCP** -- CRM integration via `@hubspot/mcp-server` npm package with private app token. Used by sponsor-proposals to create/update deals and log proposals.
- **Web APIs** -- `WebSearch` and `WebFetch` tools used by content-research and competitor-analysis to discover trending topics and fetch competitor archives.

## Key Design Decisions

1. **Prompt-driven orchestration over runtime schema enforcement** -- Skills compose via the orchestrator agent reading output and forwarding it as prompt context, not via rigid JSON schema contracts between skills. Zod validates only at the app boundary.

2. **Three surfaces, one skill library** -- All surfaces (Claude Code, Slack, CLI) share the same plugin skill library. This avoids duplication and ensures consistent behavior regardless of entry point.

3. **Security-first Slack integration** -- The Slack bot uses `acceptEdits` permission mode with a scoped `allowedTools` list that explicitly excludes `Bash`. User input is wrapped in delimiters and treated as data by the system prompt.

4. **agentskills.io compliance** -- All skills follow the Anthropic agentskills.io standard (SKILL.md with YAML frontmatter, plugin manifest). This makes skills portable and discoverable.

5. **Live APIs only** -- No demo/offline mode. All integrations (HubSpot, WebSearch, WebFetch) use real APIs, increasing credibility at the cost of integration complexity.

6. **TypeScript-only stack** -- All code is TypeScript, including analytics computation (z-scores, moving averages). The 90-day datasets (~2700 data points) are trivial for JS, eliminating the need for Python.
