[![agentskills.io](https://img.shields.io/badge/agentskills.io-compliant-blue)](https://agentskills.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Plugin-purple)](https://docs.anthropic.com/claude-code)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

<video src="https://pub-d728542fdfab417989bb13f2ffa8bc51.r2.dev/video/tldr.mp4" controls width="100%"></video>

# skill-issue

**Composable AI skills for newsletter operations** -- content research, competitor analysis, sponsor proposals, performance reporting, and more. Built as an [agentskills.io](https://agentskills.io) plugin for Claude Code with a Slack bot and CLI interface.

## Architecture

The platform is organized in three layers:

```
  User Surfaces                Core Layer                    Integrations
 ┌──────────────┐    ┌────────────────────────┐    ┌──────────────────┐
 │ Claude Code  │───>│  Orchestrator Agent     │    │  HubSpot MCP     │
 │   Plugin     │    │  (newsletter-ops.md)    │    │  (@hubspot/      │
 ├──────────────┤    │                         │    │   mcp-server)    │
 │  Slack Bot   │───>│  Skill Library          │───>│                  │
 │  (@slack/    │    │  ┌─────────────────┐    │    ├──────────────────┤
 │   bolt)      │    │  │content-research │    │    │  Web APIs        │
 ├──────────────┤    │  │competitor-      │    │    │  (WebSearch,     │
 │  Skillkit    │───>│  │  analysis       │    │    │   WebFetch)      │
 │  CLI         │    │  │content-brief    │    │    └──────────────────┘
 └──────────────┘    │  │newsletter-      │    │
                     │  │  analytics      │    │
                     │  │sponsor-proposals│    │
                     │  │performance-     │    │
                     │  │  reports        │    │
                     │  └─────────────────┘    │
                     │                         │
                     │  Shared Types (Zod)     │
                     │  @skill-issue/shared    │
                     └────────────────────────┘
```

Three surfaces expose the same skill library to different user personas:
- **Claude Code Plugin** -- Technical users invoke skills directly
- **Slack Bot** -- Non-technical users access skills via natural language
- **Skillkit CLI** -- Developers generate new skills from descriptions

See [docs/architecture.md](docs/architecture.md) for the full system design.

## Getting Started

### Prerequisites

- Node.js >= 20
- npm (workspaces)
- Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- Slack workspace (for bot features)
- HubSpot account with private app token (for CRM features)

### Setup

```bash
# Clone the repository
git clone https://github.com/FiveOhhWon/skill-issue.git
cd skill-issue

# Install dependencies
npm install

# Build all packages
npm run build

# Configure environment variables
cp .env.example .env
# Edit .env with your tokens:
#   SLACK_BOT_TOKEN=xoxb-...
#   SLACK_APP_TOKEN=xapp-...
#   HUBSPOT_ACCESS_TOKEN=pat-...
#   ANTHROPIC_API_KEY=sk-ant-...

# For Slack bot / Skillkit shell commands, export .env into your terminal
set -a
source .env
set +a
```

### Running

```bash
# Start the web app (http://localhost:3000)
# Next.js reads .env automatically.
npm run dev:web

# Start the Slack bot (new terminal)
# Requires SLACK_BOT_TOKEN and SLACK_APP_TOKEN in your shell env.
npm run start:slack-bot

# Generate a new skill with Skillkit
npx skillkit --describe "Track social media mentions" --name influence-tracker

# Use skills directly in Claude Code
# Install the plugin, then use skills via the orchestrator agent
```

The web app now defaults to the Skill Issues OS desktop window manager experience (drag/resize/minimize/maximize, taskbar, icon double-click open) for dashboard workflows.

### Slack App Setup (Manifest)

1. In Slack, create a new app from manifest.
2. Paste the manifest from [apps/slack-bot/slack-app-manifest.yaml](apps/slack-bot/slack-app-manifest.yaml).
3. Ensure AI Assistant features are enabled (Assistant view + assistant thread events).
4. Install the app to your workspace.
5. Create an app-level token with `connections:write` (for Socket Mode).
6. Set env vars in `.env`:
   - `SLACK_BOT_TOKEN=xoxb-...`
   - `SLACK_APP_TOKEN=xapp-...`

### Troubleshooting

- If chat shows `Claude Code process exited with code 1`, verify Claude auth:
  - Run `claude auth status` in your terminal.
  - Or set `ANTHROPIC_API_KEY` in `.env`.
- If you launched the app from inside a Claude/Codex shell, ensure `CLAUDECODE` is not exported into child processes.
- Claude Agent SDK discovers project skills from `.claude/skills` (tracked here as a symlink to `plugin/skills`).

## Skills

| Skill | Description | Pipeline |
|-------|-------------|----------|
| `content-research` | Discovers trending topics via WebSearch/WebFetch | Content |
| `competitor-analysis` | Identifies coverage gaps vs. competing newsletters | Content |
| `content-brief` | Synthesizes ranked editorial briefs | Content |
| `newsletter-analytics` | Computes KPIs, detects anomalies from CSV/JSON | Sponsor, Reporting |
| `sponsor-proposals` | Generates data-backed proposals with CPM tiers | Sponsor |
| `performance-reports` | Formats stakeholder-ready reports | Reporting |

### Pipelines

Skills compose into three pipelines via the orchestrator agent:

1. **Content Pipeline**: `content-research` -> `competitor-analysis` -> `content-brief`
2. **Sponsor Pipeline**: `newsletter-analytics` -> `sponsor-proposals` -> HubSpot MCP
3. **Reporting Pipeline**: `newsletter-analytics` -> `performance-reports`

See [docs/composability.md](docs/composability.md) for how prompt-driven orchestration works.

## Tech Stack

- **Runtime**: Node.js 20+ / TypeScript 5.5
- **Agent Framework**: Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- **Validation**: Zod schemas at application boundary
- **Slack**: `@slack/bolt` with Socket Mode
- **CRM**: HubSpot MCP (`@hubspot/mcp-server`)
- **Build**: tsup (apps), tsc (shared package)
- **Monorepo**: npm workspaces

## Project Structure

```
skill-issue/
  apps/
    slack-bot/          # Slack bot (Bolt + Socket Mode)
    skillkit/           # Skill generation CLI
  .claude/
    skills/             # SDK project skills (symlink to plugin/skills)
  packages/
    shared/             # Zod schemas and TypeScript types
  plugin/
    .claude-plugin/     # agentskills.io plugin manifest
    skills/             # Skill definitions (SKILL.md files)
    agents/             # Orchestrator agent
    commands/           # Plugin commands
    hooks/              # Plugin hooks
  design/               # Slack UX specs (Block Kit JSON)
  docs/                 # Architecture and guides
  examples/             # Demo pipelines
  fixtures/             # Sample data for demos
```

## Documentation

- [Architecture](docs/architecture.md) -- System design, component relationships, data flow
- [Composability](docs/composability.md) -- Prompt-driven orchestration and pipeline composition
- [Authoring Guide](docs/authoring.md) -- How to create new skills
- [Demo Script](docs/demo-script.md) -- 10-minute demo walkthrough

## Contributing

1. Read the [authoring guide](docs/authoring.md) to understand the skill format
2. Use Skillkit to scaffold new skills: `npx skillkit --describe "..." --name my-skill`
3. Place skills in `plugin/skills/{name}/SKILL.md`
4. Add Zod schemas to `packages/shared/` if the skill has structured output
5. Run `npm run build` to verify everything compiles

## License

MIT
