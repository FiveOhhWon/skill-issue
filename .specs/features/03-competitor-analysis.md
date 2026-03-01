# Feature: Competitor Analysis Skill
## Status
pending
## Overview
Fetches and analyzes competitor newsletter archives, identifies coverage gaps, and cross-references with content research output. Second skill in the content pipeline.
## Requirements
- [REQ-1]: SKILL.md must have valid YAML frontmatter with name, description, version, and tools (WebFetch)
- [REQ-2]: SKILL.md must reference CompetitorAnalysisOutput schema as expected output format
- [REQ-3]: Skill must instruct Claude to fetch competitor newsletter archives via WebFetch
- [REQ-4]: Skill must define gap analysis methodology: topics competitors covered vs. topics from content-research output
- [REQ-5]: Skill must compute coverage frequency and timing analysis (how often competitors cover topics, how quickly)
- [REQ-6]: Skill must consume ContentResearchOutput as input context (pipeline composition via orchestrator prompt forwarding)
- [REQ-7]: Output must be structured JSON matching CompetitorAnalysisOutput schema (competitors array, gaps array, opportunities)
## Acceptance Criteria
- [ ] [AC-1]: SKILL.md YAML frontmatter passes agentskills.io validation
- [ ] [AC-2]: When given content-research output as context, skill produces gap analysis with competitor coverage map
- [ ] [AC-3]: Each gap entry identifies the topic, which competitors missed it, and an opportunity score
- [ ] [AC-4]: Output JSON validates against CompetitorAnalysisOutput Zod schema
- [ ] [AC-5]: Skill handles the case where no competitor data is available (graceful degradation)
## Technical Approach
### Files to Create
- `plugin/skills/competitor-analysis/SKILL.md` - Full skill definition with YAML frontmatter + markdown instructions
### Files to Modify
- None
### Architecture Notes
- Consumes content-research output via orchestrator prompt forwarding (not direct import)
- The orchestrator passes content-research JSON as context in the prompt to this skill
- Competitor list should be configurable (default: Morning Brew, The Hustle, Dense Discovery, TLDR competitors)
- Gap analysis is qualitative (Claude reasoning) enriched with quantitative signals (coverage counts)
## Dependencies
- Depends on: 01, 02
- Blocks: 04, 12
## Testing
### Unit Tests
- YAML frontmatter is valid with required fields
- Instructions clearly describe consuming upstream skill output
- Output format matches CompetitorAnalysisOutput schema fields
### Integration Tests
- Skill produces valid output when given sample ContentResearchOutput as context
- Pipeline: content-research -> competitor-analysis produces coherent cross-referenced results
## Estimated Complexity
medium
