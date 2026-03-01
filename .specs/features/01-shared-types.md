# Feature: Shared Types & Schemas
## Status
pending
## Overview
Define the core type system and Zod schemas that validate composability contracts at the TypeScript application boundary. These schemas validate data flowing through the Slack bot and skillkit -- they do not enforce contracts between skills inside Claude Code (that is prompt-driven).
## Requirements
- [REQ-1]: `ContentResearchOutput` Zod schema must validate trending topics with relevance scores (0-100), source URLs, timestamps, and topic domains
- [REQ-2]: `CompetitorAnalysisOutput` Zod schema must validate gap analysis results with competitor names, coverage maps, and opportunity scores
- [REQ-3]: `ContentBriefOutput` Zod schema must validate ranked stories with headlines, angles, source attribution, and priority levels
- [REQ-4]: `AnalyticsOutput` Zod schema must validate KPIs (open rate, CTR, growth rate, churn rate), anomaly flags with severity, and time series data
- [REQ-5]: `SponsorProposalOutput` Zod schema must validate audience fit scores, CPM tiers (Standard/Premium/Exclusive), and proposal sections
- [REQ-6]: `PerformanceReportOutput` Zod schema must validate formatted metrics, period comparisons, trend summaries, and anomaly details
- [REQ-7]: Pipeline type connectors must define that output of skill N can be input to skill N+1 (ContentResearch -> CompetitorAnalysis -> ContentBrief; Analytics -> SponsorProposal; Analytics -> PerformanceReport)
- [REQ-8]: HubSpot entity types must be defined for contacts, deals, and notes
- [REQ-9]: All schemas must export both the Zod schema and inferred TypeScript type (z.infer)
## Acceptance Criteria
- [ ] [AC-1]: All 6 Zod schemas parse valid test data without errors
- [ ] [AC-2]: All 6 Zod schemas reject malformed data with descriptive error messages
- [ ] [AC-3]: TypeScript types are correctly inferred from Zod schemas (no manual type definitions that drift)
- [ ] [AC-4]: Pipeline connectors are type-safe -- passing wrong skill output to next skill is a compile error
- [ ] [AC-5]: Package builds with `tsc` and produces declaration files
- [ ] [AC-6]: Package is importable from `apps/slack-bot` and `apps/skillkit` as `@skill-issue/shared`
## Technical Approach
### Files to Create
- `packages/shared/src/schemas/content-research.ts` - ContentResearchOutput Zod schema + inferred type
- `packages/shared/src/schemas/competitor-analysis.ts` - CompetitorAnalysisOutput Zod schema + inferred type
- `packages/shared/src/schemas/content-brief.ts` - ContentBriefOutput Zod schema + inferred type
- `packages/shared/src/schemas/analytics.ts` - AnalyticsOutput Zod schema + inferred type
- `packages/shared/src/schemas/sponsor-proposal.ts` - SponsorProposalOutput Zod schema + inferred type
- `packages/shared/src/schemas/performance-report.ts` - PerformanceReportOutput Zod schema + inferred type
- `packages/shared/src/schemas/index.ts` - Barrel export for all schemas
- `packages/shared/src/types/pipeline.ts` - Pipeline type connectors (PipelineStep, PipelineInput, PipelineOutput)
- `packages/shared/src/types/hubspot.ts` - HubSpot entity types (Contact, Deal, Note)
- `packages/shared/src/types/index.ts` - Barrel export for all types
### Files to Modify
- `packages/shared/src/index.ts` - Re-export schemas and types
- `packages/shared/package.json` - Add zod dependency
## Architecture Notes
- Zod is the single source of truth for types -- never define separate interfaces
- Use `z.infer<typeof Schema>` for all TypeScript types
- Pipeline connectors use branded types or discriminated unions to prevent wrong-skill connections at compile time
- Keep schemas minimal -- only validate structure, not business logic
- HubSpot types mirror the HubSpot API response shapes needed by the sponsor-proposals skill
## Dependencies
- Depends on: 00
- Blocks: 02, 03, 04, 05, 06, 07, 08, 09, 10a, 10b, 12
## Testing
### Unit Tests
- Each schema validates sample valid data
- Each schema rejects invalid data (missing fields, wrong types, out-of-range values)
- Pipeline type connectors enforce correct skill chaining at compile time
- HubSpot types cover required API fields
### Integration Tests
- Package builds and exports all schemas
- Schemas are importable and usable from app packages
## Estimated Complexity
medium
