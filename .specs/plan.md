# skill-issue: Composable AI Skills Platform for Newsletter Operations

## Development Plan

---

## 1. Project Overview

**skill-issue** is an open-source platform that demonstrates composable AI skills for newsletter operations at scale. It targets the TLDR use case (7M+ subscribers, largest tech newsletter network) and proves two core principles:

1. **Clean abstractions that let non-technical users compose primitives into useful workflows without writing code** — via a Slack bot that exposes the full skill library through natural language.
2. **Design for composability** — via the agentskills.io standard, where skills consume each other's structured outputs to form pipelines automatically.

**Composition Model**: Skills compose via **prompt-driven orchestration through the orchestrator agent**, not via runtime JSON schema enforcement. The orchestrator agent reads one skill's output and feeds it to the next skill as prompt context. Zod schemas in `packages/shared` validate data at the TypeScript application boundary (Slack bot, skillkit) — they do not enforce inter-skill contracts within Claude Code at runtime. SKILL.md files are markdown instructions, not JSON schema definitions.

The platform ships three surfaces (Claude Code plugin, Slack bot, CLI skillkit) backed by one shared skill library, with live API integrations (no demo/offline mode).

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Language** | TypeScript (all code, no Python) | User mandate. Unified stack across plugin, apps, and packages. |
| **Monorepo** | npm workspaces | Lightweight, no extra tooling. Shared types via `packages/shared`. |
| **Agent SDK** | `@anthropic-ai/claude-agent-sdk` | Core runtime for Slack bot and skillkit. `query()` function with `outputFormat: 'stream-json'` for Slack streaming. camelCase API (`mcpServers`, `permissionMode`, `allowedTools`, `settingSources`). Inline `Options` type (NOT `ClaudeAgentOptions`). Use `acceptEdits` permission mode with scoped `allowedTools` (see Security section). `createSdkMcpServer` + `tool()` for in-process MCP tools. |
| **Skill Standard** | agentskills.io | Anthropic's open standard (Dec 2025). SKILL.md with YAML frontmatter. Plugin manifest at `.claude-plugin/plugin.json`. Skills at `skills/<name>/SKILL.md`. |
| **CRM Integration** | HubSpot MCP (`@hubspot/mcp-server` npm) | Local npm server with private app token in `.env` for demo reliability. Simpler than full OAuth flow. Tools: search contacts, create deals, create notes, search deals. Write ops in beta. Remote URL `https://mcp.hubspot.com` available as alternative for production OAuth 2.1 + PKCE. |
| **Slack** | `@slack/bolt` ^4.4.0 | Socket Mode for dev simplicity. Session continuity via `session_id` from `system/init` + `resume`. Streaming via `chat.update` throttled to 1/sec. Claude markdown to Slack mrkdwn conversion required (see Feature 09). |
| **Validation** | Zod | Schema validation for skill I/O at app boundaries, analytics computations, CLI args. Not used for inter-skill contract enforcement in Claude Code. |
| **Build** | `tsup` or `tsc` | Fast TypeScript compilation. tsup for apps (bundled), tsc for shared package (declarations). |
| **Design** | Figma | Architecture diagram, Slack UX mockups, visual workflow concept, landing page. All 4 deliverables in Phase 0. |

### Security Model

**Permission Mode**: Use `acceptEdits` (NOT `bypassPermissions`) with a scoped `allowedTools` list. This prevents arbitrary shell execution from Slack user input.

**Allowed Tools** (explicitly scoped):
- `Skill`, `Read`, `Glob`, `Grep`, `WebSearch`, `WebFetch`, `Task`
- `mcp__slack__*` (Slack MCP tools)
- `mcp__hubspot__*` (HubSpot MCP tools)
- `Bash` is **excluded** — no shell execution from user-facing surfaces.

**Input Sanitization**: All Slack user messages must be wrapped in clear delimiters before passing to `query()`. System prompt instructs Claude to treat user input as data, not instructions. See Feature 09 for implementation details.

### Cost Model Note

Each `query()` call spawns a full Claude session. A multi-skill pipeline (3 skills) means 3+ Claude API calls minimum. This is a prototype cost model suitable for demos and portfolio presentation, not production-scale usage.

---

## 3. Feature List

### Feature 00: Project Scaffolding
**Description**: Initialize the monorepo with npm workspaces, TypeScript configuration, shared package structure, and all directory scaffolding.

- Root `package.json` with npm workspaces: `packages/*`, `apps/*`
- Root `tsconfig.json` with project references
- `packages/shared/` — Zod schemas for skill I/O contracts, shared types, utility functions
- `plugin/` directory structure with `.claude-plugin/plugin.json` manifest
- `apps/slack-bot/` and `apps/skillkit/` package scaffolding
- `fixtures/`, `design/`, `docs/`, `examples/` directories
- ESLint + Prettier config
- `plugin/.mcp.json` with HubSpot MCP configuration (using `@hubspot/mcp-server` npm with private app token)

### Feature 01: Shared Types & Schemas
**Description**: Define the core type system and Zod schemas that validate composability contracts at the TypeScript application boundary. These schemas validate data flowing through the Slack bot and skillkit — they do not enforce contracts between skills inside Claude Code (that is prompt-driven).

- `ContentResearchOutput` schema — trending topics with relevance scores, sources, timestamps
- `CompetitorAnalysisOutput` schema — gap analysis, competitor coverage map, opportunities
- `ContentBriefOutput` schema — ranked stories, headlines, angles, source attribution
- `AnalyticsOutput` schema — open rate, CTR, growth rate, anomaly flags, time series
- `SponsorProposalOutput` schema — audience fit scores, CPM tiers, proposal sections
- `PerformanceReportOutput` schema — formatted metrics, period comparisons, trend summaries
- Pipeline type connectors (output of skill N is input of skill N+1)
- HubSpot entity types (contacts, deals, notes)

### Feature 02: Content Research Skill
**Description**: Skill that uses WebSearch + WebFetch to discover trending topics relevant to a newsletter's audience, scoring them by relevance and recency.

- `plugin/skills/content-research/SKILL.md` with proper YAML frontmatter
- Web search for trending topics in specified domains (tech, AI, startups, etc.)
- Relevance scoring algorithm (keyword match, recency, source authority)
- Ranked JSON output conforming to `ContentResearchOutput` schema
- Configurable parameters: topic domains, time window, result count

### Feature 03: Competitor Analysis Skill
**Description**: Fetches and analyzes competitor newsletter archives, identifies coverage gaps, and cross-references with content research output.

- `plugin/skills/competitor-analysis/SKILL.md` with YAML frontmatter
- Competitor archive fetching via WebFetch
- Gap analysis: topics competitors covered vs. topics from content-research
- Coverage frequency and timing analysis
- Cross-referencing with Feature 02 output (pipeline composability via orchestrator prompt forwarding)
- JSON output conforming to `CompetitorAnalysisOutput` schema

### Feature 04: Content Brief Skill
**Description**: Synthesizes research and competitor gaps into actionable editorial briefs with ranked story candidates.

- `plugin/skills/content-brief/SKILL.md` with YAML frontmatter
- Consumes output from Features 02 + 03 (content pipeline composition via orchestrator prompt forwarding)
- Ranked story list with headlines, angles, and talking points
- Source attribution and link compilation
- Markdown output for human readability (with structured data section)
- Tone and audience targeting parameters

### Feature 05: Newsletter Analytics Skill
**Description**: Ingests CSV/JSON newsletter metrics, computes KPIs, and detects anomalies — all in TypeScript (no Python).

- `plugin/skills/newsletter-analytics/SKILL.md` with YAML frontmatter
- CSV/JSON ingestion and parsing (native TypeScript)
- KPI computation: open rate, CTR, subscriber growth, churn rate, revenue per subscriber
- Statistical anomaly detection (z-score based, moving averages)
- Time series analysis with period-over-period comparison
- JSON output conforming to `AnalyticsOutput` schema
- TypeScript computation scripts in `plugin/skills/newsletter-analytics/scripts/`
- Note: 90-day datasets (~2700 data points) are trivial for JS — no external deps needed for z-scores, moving averages, basic statistics

### Feature 06: Sponsor Proposals Skill
**Description**: Generates data-backed sponsor proposals with audience fit scoring, CPM pricing, and tier options. Integrates with HubSpot for CRM logging.

- `plugin/skills/sponsor-proposals/SKILL.md` with YAML frontmatter
- Consumes `AnalyticsOutput` from Feature 05 (sponsor pipeline composition via orchestrator prompt forwarding)
- Audience fit scoring algorithm (demographic match, engagement metrics)
- CPM pricing model with tier structure (Standard, Premium, Exclusive)
- HubSpot integration: create/update deals, log proposals as notes (via `@hubspot/mcp-server` npm)
- Markdown proposal output with structured data section

### Feature 07: Performance Reports Skill
**Description**: Formats analytics data into stakeholder-ready reports with configurable time periods.

- `plugin/skills/performance-reports/SKILL.md` with YAML frontmatter
- Consumes `AnalyticsOutput` from Feature 05 (reporting pipeline composition via orchestrator prompt forwarding)
- Report periods: weekly, monthly, quarterly
- Executive summary generation
- Trend visualization descriptions (for text-based reports)
- Comparative metrics (period-over-period, YoY)
- Markdown output formatted for stakeholder consumption

### Feature 08: Plugin Orchestration Layer
**Description**: Orchestrator agent, subagents, and commands that compose individual skills into pipelines via prompt-driven routing (reading skill outputs and forwarding them as context to the next skill).

- `plugin/agents/newsletter-ops.md` — orchestrator agent that routes requests to appropriate skill pipelines
- `plugin/agents/data-analyst.md` — analysis subagent for deep-dive analytics
- `plugin/commands/daily-brief.md` — runs content pipeline end-to-end
- `plugin/commands/sponsor-report.md` — runs sponsor pipeline with HubSpot logging
- `plugin/commands/competitive-scan.md` — runs competitor analysis with trend context
- `plugin/hooks/hooks.json` — lifecycle hooks for skill execution
- Pipeline composition wiring (orchestrator reads skill output, forwards as prompt context to next skill)

### Feature 09: Slack Bot
**Description**: Production Slack bot using Agent SDK that exposes the full skill library to non-technical users through natural language. Includes security hardening, progress indicators, and Slack-specific formatting.

- `apps/slack-bot/src/app.ts` — Slack Bolt with Socket Mode setup
- `apps/slack-bot/src/claude-handler.ts` — Agent SDK `query()` integration with plugin loaded
  - `outputFormat: 'stream-json'` for streaming responses
  - `acceptEdits` permission mode with scoped `allowedTools` (no `Bash`)
  - Input sanitization: wrap Slack user messages in delimiters, system prompt treats user input as data
- `apps/slack-bot/src/formatters.ts` — Claude markdown to Slack mrkdwn + Block Kit conversion
  - Markdown-to-mrkdwn conversion utility: `**bold**` to `*bold*`, `[text](url)` to `<url|text>`, `# heading` to `*heading*`
  - Message truncation/pagination: handle Slack's 4000-char `text` limit and 50-block limit
  - Split long outputs into threaded follow-up messages or paginated blocks
- `apps/slack-bot/src/progress.ts` — Progress indicators for long-running pipelines
  - Post initial "thinking" message when pipeline starts
  - Per-skill status updates via `chat.update` (e.g., "Researching topics...", "Analyzing competitors...", "Generating brief...")
  - Final message replaces progress with complete output
- Session continuity via `session_id` from `system/init` + `resume` option
- Streaming response delivery via `chat.update` (throttled to 1/sec)
- Error handling and graceful degradation
- Thread support for multi-turn conversations
- Skill auto-discovery from plugin directory

### Feature 10a: Skillkit Core (Generative Skill Builder CLI)
**Description**: CLI tool that generates new agentskills.io-compliant skills from natural language descriptions. Standalone — no dependency on Slack bot.

**Depends on**: Feature 01

- `apps/skillkit/src/forge.ts` — orchestrator using Agent SDK `query()`
- `apps/skillkit/src/planner.ts` — planner subagent: designs skill structure from description
- `apps/skillkit/src/writer.ts` — writer subagent: generates SKILL.md + supporting scripts
- `apps/skillkit/src/reviewer.ts` — reviewer subagent: validates agentskills.io compliance
- `apps/skillkit/src/validator.ts` — programmatic validation of generated skills
- `apps/skillkit/src/cli.ts` — CLI entry point (`npx skillkit --describe "..." --name foo`)
- Template system for SKILL.md generation

### Feature 10b: Skillkit Slack Integration (MCP Tool)
**Description**: In-process MCP tool that registers skillkit as a Slack-accessible tool, enabling skill generation from Slack.

**Depends on**: Features 09, 10a

- `apps/skillkit/src/mcp-tool.ts` — `createSdkMcpServer` + `tool()` registration for Slack bot integration
- Wiring into Slack bot's MCP server configuration
- Slack-specific formatting of skillkit output

### Feature 11: Figma Design Round
**Description**: Four Figma design deliverables that visualize the platform architecture and user experience.

- Architecture diagram: three surfaces, skill library, pipeline composition model
- Slack UX mockups: message flows, Block Kit layouts, skill invocation patterns
- Visual workflow concept: how skills compose into pipelines (node-graph style)
- Landing page design: hero, features, demo walkthrough, CTA

### Feature 12: Documentation & Examples
**Description**: Architecture docs, composability guide, skill authoring guide, demo walkthroughs, and project README.

- `README.md` — Project README with badges, architecture diagram embed, getting started guide, feature overview, demo GIFs/screenshots, tech stack, and CTA. This is the first thing a hiring manager sees.
- `docs/architecture.md` — system design, component relationships, data flow
- `docs/composability.md` — how skills compose (prompt-driven orchestration model), pipeline model, I/O contracts at app boundary
- `docs/authoring.md` — how to write new skills (agentskills.io guide)
- `docs/demo-script.md` — 10-minute demo walkthrough (Acts 1-4 + closing)
- `examples/content-pipeline/` — end-to-end content pipeline demo
- `examples/sponsor-pipeline/` — sponsor pipeline with HubSpot demo
- `examples/skillkit-generation/` — generating a new skill from Slack
- `fixtures/` — sample CSV/JSON data for analytics demos

---

## 4. Dependency Graph

```
Feature 00: Project Scaffolding
    └── Feature 01: Shared Types & Schemas
            ├── Feature 02: Content Research Skill
            │       └── Feature 03: Competitor Analysis Skill
            │               └── Feature 04: Content Brief Skill
            ├── Feature 05: Newsletter Analytics Skill
            │       ├── Feature 06: Sponsor Proposals Skill
            │       └── Feature 07: Performance Reports Skill
            ├── Feature 08: Plugin Orchestration Layer
            │       (depends on 01 for interfaces; testing requires 02-07)
            │       └── Feature 09: Slack Bot
            │               └── Feature 10b: Skillkit Slack Integration
            └── Feature 10a: Skillkit Core (standalone CLI)

Feature 11: Figma Design Round — independent (Phase 0, before implementation)
Feature 12: Documentation & Examples — depends on Features 00-10b
```

### Explicit Dependencies

| Feature | Depends On |
|---------|-----------|
| 00 | (none) |
| 01 | 00 |
| 02 | 01 |
| 03 | 01, 02 |
| 04 | 01, 02, 03 |
| 05 | 01 |
| 06 | 01, 05 |
| 07 | 01, 05 |
| 08 | 01 (implementation); 02-07 (integration testing) |
| 09 | 01, 08 |
| 10a | 01 |
| 10b | 09, 10a |
| 11 | (none — Phase 0) |
| 12 | 00-10b |

---

## 5. Implementation Phases

### Phase 0: Design (Figma)
**Features**: 11
**Goal**: Visual foundation — architecture diagram, Slack UX, workflow concept, landing page.
**Deliverables**: 4 Figma design exports in `design/`.

### Phase 1: Foundation
**Features**: 00, 01
**Goal**: Monorepo scaffolding, shared types, Zod schemas. Every subsequent feature builds on this.
**Parallelism**: Sequential (01 depends on 00).

### Phase 2: Skills — Content Pipeline
**Features**: 02, 03, 04
**Goal**: First composition pipeline. Content research flows into competitor analysis, which flows into content brief.
**Parallelism**: Sequential (pipeline dependency chain).

### Phase 3: Skills — Analytics & Sponsor Pipeline
**Features**: 05, 06, 07
**Goal**: Second and third composition pipelines. Analytics feeds both sponsor proposals and performance reports.
**Parallelism**: 05 first, then 06 and 07 in parallel.

### Phase 4: Orchestration
**Features**: 08
**Goal**: Wire all skills into the plugin orchestration layer. Agents, commands, hooks. Can begin implementation after Feature 01 (interfaces defined); full integration testing requires all skills (02-07) complete.
**Parallelism**: Implementation can overlap with late Phase 2/Phase 3. Integration testing is gated on all skills.

### Phase 5: Applications
**Features**: 09, 10a, 10b
**Goal**: Slack bot and skillkit. Two user-facing applications.
**Parallelism**: 10a (standalone CLI) can start as soon as Phase 1 completes, in parallel with Phases 2-4. 09 (Slack bot) depends on Phase 4. 10b (Slack integration) depends on both 09 and 10a.

### Phase 6: Documentation & Polish
**Features**: 12
**Goal**: Project README, architecture docs, guides, demo walkthroughs, fixture data, examples.

---

## 6. Complexity Assessment

**Complexity Score: 5 / 5**

Justification:
- **14 features** (with 10a/10b split) spanning plugin skills, shared libraries, two full applications, design deliverables, and documentation
- **Three distinct composition pipelines** with prompt-driven orchestration
- **Two full application builds** (Slack bot with streaming + session management + security hardening, skillkit with multi-agent orchestration)
- **External integrations**: HubSpot MCP (local npm server with private app token), Slack (Socket Mode, Block Kit), Agent SDK
- **Figma design round** as a mandatory Phase 0 deliverable
- **agentskills.io compliance** across all skills with proper YAML frontmatter, manifest, hooks
- **Live APIs only** (no demo/offline mode) — increases integration complexity
- **Cross-surface composability** — same skills must work from Claude Code, Slack, and CLI
- **Security hardening** — scoped permissions, input sanitization, no shell execution from user-facing surfaces

### Recommended Agent Count: 4-5

- 1 agent for scaffolding + shared types (Phase 1)
- 2 agents for skills in parallel where dependency graph allows (Phases 2-3)
- 1 agent for Slack bot (Phase 5)
- 1 agent for skillkit (Phase 5, partially parallel with Phases 2-4 for 10a)
- Documentation can be handled by any agent post-implementation

---

## 7. Key Technical Risks

| Risk | Mitigation |
|------|-----------|
| Agent SDK API surface changes | Pin exact version, validate imports early in Feature 00 |
| HubSpot MCP connection issues | Use `@hubspot/mcp-server` npm with private app token for demo reliability; full OAuth as fallback |
| Slack streaming throttle limits | Implement backoff in formatters, degrade gracefully to single-post |
| Slack message length limits | Truncation/pagination strategy in `formatters.ts` — split at 4000 chars, max 50 blocks per message |
| Prompt injection via Slack | Input sanitization with delimiters, system prompt treats user input as data, scoped `allowedTools` excludes `Bash` |
| agentskills.io spec ambiguity | Build validator in Feature 10a, test all skills against it |
| TypeScript analytics perf (vs Python) | 90-day datasets (~2700 points) are trivial for JS — no concern. Use typed arrays for larger sets. |
| Multi-skill pipeline cost | Each `query()` = full Claude session. 3-skill pipeline = 3+ API calls. Acceptable for demo, document as prototype cost model. |
| Skillkit live demo fragility | Pre-seed a tested "warm-up" example for Act 4 demo. Have fallback prepared if NL generation fails. |

---

## 8. Demo Alignment

Each phase maps to a demo act:

| Demo Act | Phase | Features |
|----------|-------|----------|
| Act 2: "The Power User" (Claude Code) | Phases 2-4 | 02-08 (skills + orchestration) |
| Act 3: "The Non-Technical User" (Slack) | Phase 5 | 09 (Slack bot) |
| Act 4: "The Builder" (Skillkit) | Phase 5 | 10a, 10b (skillkit) |
| Visual storytelling | Phase 0 | 11 (Figma designs) |

### Demo Risk Mitigation (Act 4)
Act 4 (Skillkit Live Demo) is the highest-risk demo segment. It requires: (1) the generated SKILL.md to be valid, (2) Claude to correctly interpret and execute the new skill, (3) the output to be meaningful. **Mitigation**: Pre-seed a tested warm-up example that's been validated end-to-end. Have a fallback prepared (pre-generated skill that can be shown if live generation fails).
