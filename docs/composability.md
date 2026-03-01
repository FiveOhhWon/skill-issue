# Composability: Prompt-Driven Orchestration

## The Composability Model

skill-issue uses **prompt-driven orchestration** to compose skills into pipelines. This is fundamentally different from traditional runtime schema enforcement.

### How It Works

1. The orchestrator agent reads a skill's output (which is free-form text or JSON produced by Claude)
2. It includes that output as prompt context for the next skill
3. The next skill interprets the context and produces its own output
4. Repeat until the pipeline is complete

```
User Request
    │
    v
┌──────────────────┐
│  Orchestrator    │
│  Agent           │
│                  │
│  "Run the        │
│   content        │     Skill 1 Output (JSON)
│   pipeline"      │────────────────────────────┐
│                  │                             │
└──────────────────┘                             v
                                    ┌──────────────────┐
                                    │  Skill 2          │
                                    │  (receives output │
                                    │   as prompt       │
                                    │   context)        │
                                    └──────────────────┘
```

### Why Prompt-Driven?

Skills run inside Claude Code, where the orchestrator is itself an AI agent. There is no traditional "runtime" between skills -- the orchestrator reads one skill's output as text and writes a prompt for the next skill. This means:

- **No rigid JSON contracts between skills** -- Skills can produce any output format. The orchestrator interprets it.
- **Flexible composition** -- New skills can be added without changing existing ones. The orchestrator adapts.
- **Natural error handling** -- If a skill produces unexpected output, the orchestrator can ask for clarification or try a different approach.

### The Boundary Distinction

There are two distinct contexts where data validation happens:

| Context | Mechanism | Purpose |
|---------|-----------|---------|
| **Inside Claude Code** (between skills) | Prompt context | Flexible composition, no schema enforcement |
| **At the app boundary** (Slack bot, CLI) | Zod schemas | Validate structured data for external consumption |

Zod schemas in `packages/shared` validate data **only** when it crosses the TypeScript application boundary:
- When the Slack bot receives structured output to format as Block Kit
- When the CLI outputs a generated SKILL.md
- When analytics data is serialized for storage

## Pipeline Composition

### Content Pipeline

```
content-research                     competitor-analysis              content-brief
┌─────────────────┐                 ┌─────────────────┐             ┌────────────┐
│ Input: topic     │                │ Input: research   │             │ Input: both │
│ domains          │                │ output + competitor│             │ upstream    │
│                  │  JSON output   │ list              │ JSON output │ outputs     │
│ Tools: WebSearch │───────────────>│                   │────────────>│             │
│         WebFetch │                │ Tools: WebFetch   │             │ Output:     │
│                  │                │                   │             │ Markdown    │
│ Output: topics,  │                │ Output: gaps,     │             │ brief       │
│ relevance scores │                │ opportunity scores│             │             │
└─────────────────┘                 └─────────────────┘             └────────────┘
```

Data flows as:
1. **JSON** from content-research (structured topics with scores)
2. **JSON** from competitor-analysis (gap analysis with opportunities)
3. **Markdown** from content-brief (human-readable editorial brief)

### Sponsor Pipeline

```
newsletter-analytics          sponsor-proposals            HubSpot MCP
┌─────────────────┐          ┌─────────────────┐         ┌──────────┐
│ Input: CSV/JSON  │          │ Input: analytics │         │ Create   │
│ metrics file     │          │ output + sponsor │         │ deal     │
│                  │ JSON     │ profiles         │ MCP     │          │
│ Tools: Read, Glob│────────>│                  │────────>│ Log note │
│                  │          │ Output: proposal │         │          │
│ Output: KPIs,    │          │ with CPM tiers   │         │          │
│ anomalies        │          │                  │         │          │
└─────────────────┘          └─────────────────┘         └──────────┘
```

### Reporting Pipeline

```
newsletter-analytics          performance-reports
┌─────────────────┐          ┌──────────────────┐
│ (shared with     │          │ Input: analytics  │
│  sponsor         │ JSON     │ output + period   │
│  pipeline)       │────────>│                   │
│                  │          │ Output: Markdown   │
│                  │          │ report with KPIs,  │
│                  │          │ trends, anomalies  │
└─────────────────┘          └──────────────────┘
```

## I/O Contracts at the App Boundary

When data exits Claude Code and enters the Slack bot or CLI, Zod schemas enforce structure:

```typescript
import { AnalyticsOutputSchema } from '@skill-issue/shared';

// At the Slack bot boundary: validate before formatting
const result = AnalyticsOutputSchema.parse(claudeOutput);
const blocks = buildPerformanceReportBlocks(result);
await slack.chat.postMessage({ blocks });
```

### Pipeline Type Connectors

The `PipelineStep` types in `packages/shared` define which skills can chain:

```typescript
// Type-safe pipeline connections
type ContentResearchStep = PipelineStep<'content-research', void, ContentResearchOutput>;
type CompetitorAnalysisStep = PipelineStep<'competitor-analysis', ContentResearchOutput, CompetitorAnalysisOutput>;
type ContentBriefStep = PipelineStep<'content-brief', CompetitorAnalysisOutput, ContentBriefOutput>;
```

These types provide compile-time safety for the app layer. Inside Claude Code, the orchestrator handles composition via prompts.

## Adding New Compositions

To compose skills in a new way:

1. Create a new pipeline description in the orchestrator agent
2. Define the skill order and what context to forward
3. Optionally add Zod schemas if the output needs app-boundary validation

No code changes to existing skills are required.
