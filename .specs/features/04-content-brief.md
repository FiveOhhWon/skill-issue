# Feature: Content Brief Skill
## Status
pending
## Overview
Synthesizes research and competitor gaps into actionable editorial briefs with ranked story candidates. Final skill in the content pipeline.
## Requirements
- [REQ-1]: SKILL.md must have valid YAML frontmatter with name, description, and version
- [REQ-2]: SKILL.md must reference ContentBriefOutput schema as expected output format
- [REQ-3]: Skill must consume both ContentResearchOutput and CompetitorAnalysisOutput as input context
- [REQ-4]: Skill must produce a ranked story list with headlines, angles, and talking points
- [REQ-5]: Each story must include source attribution and link compilation from upstream research
- [REQ-6]: Skill must support tone and audience targeting parameters (e.g., technical vs. business audience)
- [REQ-7]: Output must be markdown for human readability with a structured data section (JSON) for programmatic use
## Acceptance Criteria
- [ ] [AC-1]: SKILL.md YAML frontmatter passes agentskills.io validation
- [ ] [AC-2]: When given research + competitor analysis output, skill produces ranked story list
- [ ] [AC-3]: Stories are ranked by a composite score (relevance + gap opportunity + recency)
- [ ] [AC-4]: Each story has headline, angle, talking points, and source links
- [ ] [AC-5]: Output includes both human-readable markdown and machine-parseable JSON section
- [ ] [AC-6]: Output validates against ContentBriefOutput Zod schema
## Technical Approach
### Files to Create
- `plugin/skills/content-brief/SKILL.md` - Full skill definition with YAML frontmatter + markdown instructions
### Files to Modify
- None
### Architecture Notes
- This is the terminal skill in the content pipeline (research -> competitor -> brief)
- Consumes two upstream skill outputs via orchestrator prompt forwarding
- The brief format should match what a newsletter editor would actually use
- Markdown output includes a fenced JSON block at the end for structured data extraction
- Tone parameters allow the same pipeline to serve different newsletter verticals (TLDR Tech vs TLDR AI vs TLDR Founders)
## Dependencies
- Depends on: 01, 02, 03
- Blocks: 12
## Testing
### Unit Tests
- YAML frontmatter is valid with required fields
- Instructions describe consuming two upstream outputs
- Output format specification includes both markdown and JSON sections
### Integration Tests
- Full content pipeline: research -> competitor -> brief produces coherent end-to-end output
- Brief stories reference topics and gaps from upstream skills
## Estimated Complexity
medium
