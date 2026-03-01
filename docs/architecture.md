# System Architecture

## Overview

skill-issue is a composable AI skills platform for newsletter operations. It follows a three-layer architecture: user surfaces, a core orchestration layer, and external integrations.

## Layers

### User Surfaces

Three surfaces expose the same underlying skill library:

- **Claude Code Plugin** -- Technical users interact directly with skills through Claude Code. Skills are invoked via the orchestrator agent, which reads SKILL.md files and routes requests to the appropriate pipeline.

- **Slack Bot** -- Non-technical users (editors, sales) access skills through natural language in Slack. Built with `@slack/bolt` in Socket Mode, secured with `acceptEdits` permission mode and scoped `allowedTools` (no Bash). The bot uses the Agent SDK `query()` function with streaming output.

- **Skillkit CLI** -- Power users and developers use the CLI to generate new agentskills.io-compliant skills from natural language descriptions. A three-agent pipeline (planner, writer, reviewer) produces complete SKILL.md files.

### Core Layer

- **Orchestrator Agent** (`plugin/agents/newsletter-ops.md`) -- Routes incoming requests to the appropriate skill pipeline. Reads one skill's output and feeds it as prompt context to the next skill (prompt-driven composition).

- **Skill Library** -- Six skills organized into three pipelines, all compliant with the agentskills.io standard. Each skill has a `SKILL.md` with YAML frontmatter defining its tools, input/output schemas, and composability targets.

- **Shared Types** (`packages/shared`) -- Zod schemas that validate data at the TypeScript application boundary (Slack bot, skillkit). Schemas validate structure flowing through the app layer, not between skills inside Claude Code.

### External Integrations

- **HubSpot MCP** -- CRM integration via `@hubspot/mcp-server` npm package. Used by `sponsor-proposals` to create/update deals and log proposals as notes.

- **Web APIs** -- `WebSearch` and `WebFetch` tools used by `content-research` and `competitor-analysis` to discover trending topics and fetch competitor archives.

## Component Relationships

```
┌─────────────────────────────────────────────────────┐
│                    Claude Code                       │
│  ┌─────────────┐    ┌──────────────────────────┐   │
│  │ .claude/     │    │ Orchestrator Agent        │   │
│  │ skills/      │───>│ - Reads SKILL.md files    │   │
│  └─────────────┘    │ - Routes to pipelines     │   │
│                      │ - Forwards output as      │   │
│                      │   prompt context           │   │
│                      └──────────┬───────────────┘   │
│                                 │                    │
│  ┌──────────────────────────────┼──────────────┐    │
│  │           Skill Library      │              │    │
│  │  content-research ──> competitor-analysis    │    │
│  │       ──> content-brief                     │    │
│  │  newsletter-analytics ──> sponsor-proposals │    │
│  │       ──> performance-reports               │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
         │                              │
         │ query()                      │ MCP
         v                              v
┌──────────────┐              ┌──────────────────┐
│  Slack Bot   │              │  HubSpot MCP     │
│  (app.ts)    │              │  (deals, notes)  │
│  - Bolt      │              └──────────────────┘
│  - formatters│
│  - progress  │
└──────────────┘
```

## Data Flow

### Content Pipeline

1. User requests content research (via Slack, Claude Code, or CLI)
2. Orchestrator invokes `content-research` -- uses WebSearch/WebFetch to find trending topics
3. Output (JSON with topics, relevance scores) is forwarded as prompt context
4. `competitor-analysis` receives research output, fetches competitor archives, identifies gaps
5. `content-brief` receives both upstream outputs, synthesizes into a ranked editorial brief

### Sponsor Pipeline

1. User requests a sponsor proposal
2. `newsletter-analytics` ingests CSV/JSON metrics, computes KPIs and anomalies
3. Analytics output is forwarded to `sponsor-proposals`
4. `sponsor-proposals` generates a data-backed proposal with audience fit scores and CPM tiers
5. HubSpot MCP creates/updates a deal and logs the proposal as a note

### Reporting Pipeline

1. User requests a performance report (weekly, monthly, or quarterly)
2. `newsletter-analytics` computes KPIs (shared with sponsor pipeline)
3. `performance-reports` formats analytics into a stakeholder-ready report with executive summary, trends, and anomaly highlights

## Key Design Decisions

1. **Prompt-driven orchestration** -- Skills compose via the orchestrator reading output and forwarding as prompt context, not via rigid JSON schema contracts between skills. This allows flexible, natural composition.

2. **Zod at the boundary only** -- Zod schemas validate data at the TypeScript application boundary (Slack bot input/output, CLI output). Inside Claude Code, skills communicate through prompt context.

3. **Three surfaces, one library** -- All surfaces share the same plugin skill library, avoiding duplication.

4. **Security-first Slack** -- The Slack bot uses `acceptEdits` mode with scoped `allowedTools` excluding `Bash`. User input is sanitized with delimiters.

5. **agentskills.io compliance** -- All skills follow the standard (SKILL.md with YAML frontmatter). Runtime discovery is through `.claude/skills` (symlinked to `plugin/skills` in this repo), making them portable and discoverable.

6. **TypeScript-only** -- All computation (including analytics z-scores and moving averages) is pure TypeScript. The dataset sizes (~2700 data points for 90 days) are trivial for JavaScript.

7. **Live APIs** -- No demo mode. All integrations use real APIs.

## Technology Choices

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Language | TypeScript 5.5 | Type safety, Zod integration, Node ecosystem |
| Agent SDK | @anthropic-ai/claude-agent-sdk | Official Claude Agent SDK with query(), streaming |
| Slack | @slack/bolt (Socket Mode) | No public URL needed, event-driven |
| CRM | @hubspot/mcp-server | Official MCP integration, private app token |
| Validation | Zod | Single source of truth for types, runtime validation |
| Build (apps) | tsup | Fast bundling with ESM support |
| Build (shared) | tsc | Declaration files for cross-package types |
| Monorepo | npm workspaces | Simple, built-in, no extra tooling |
