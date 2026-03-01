# Workflow Concept: Skill Composition Model

## FigJam Diagram

[View in FigJam](https://www.figma.com/online-whiteboard/create-diagram/601e1869-5086-4825-b315-3e18f4087522?utm_source=other&utm_content=edit_in_figjam&oai_id=&request_id=5ba6b5db-a1d1-47e5-9c8b-d1c61eeaf280)

## Description

This diagram visualizes the **skill composition model** for the skill-issue platform -- how individual AI skills compose into pipelines via prompt-driven orchestration.

### Architecture

**Entry Point**: User requests arrive in natural language through any of three surfaces (Slack, Claude Code, or CLI skillkit).

**Orchestrator Agent**: The central router that classifies incoming requests and dispatches them to the appropriate pipeline. The orchestrator reads one skill's output and feeds it to the next skill as prompt context -- no runtime JSON schema enforcement between skills.

### Pipelines

**Content Pipeline** (green):
1. `content-research` -- discovers trending topics via WebSearch/WebFetch, outputs JSON (topics, relevance scores)
2. `competitor-analysis` -- consumes research JSON, fetches competitor archives via WebFetch, analyzes coverage gaps, outputs JSON (gaps, opportunities)
3. `content-brief` -- consumes both upstream JSONs, synthesizes into Markdown (editorial brief with ranked stories)

**Sponsor Pipeline** (orange):
1. `newsletter-analytics` (shared) -- ingests CSV/JSON data, computes KPIs, outputs JSON (metrics, anomalies)
2. `sponsor-proposals` -- consumes analytics JSON + HubSpot CRM data, generates Markdown (data-backed proposal)
3. HubSpot MCP -- creates deal and logs notes in CRM

**Reporting Pipeline** (blue):
1. `newsletter-analytics` (shared) -- same skill instance as Sponsor Pipeline
2. `performance-reports` -- consumes analytics JSON, outputs Markdown (stakeholder report with comparisons)

### Key Design Decisions

- **Data types on edges**: JSON for structured intermediate data, Markdown for human-readable final outputs, CSV/JSON for raw data ingestion
- **Shared skill**: `newsletter-analytics` is reused across both the Sponsor and Reporting pipelines, demonstrating skill composability
- **Prompt-driven orchestration**: Skills compose via the orchestrator reading outputs and forwarding as prompt context, not via runtime schema enforcement
- **Three surfaces, one skill library**: The same pipelines are accessible from Claude Code, Slack, and CLI
