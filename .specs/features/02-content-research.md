# Feature: Content Research Skill
## Status
pending
## Overview
Skill that uses WebSearch + WebFetch to discover trending topics relevant to a newsletter's audience, scoring them by relevance and recency. This is the first skill in the content pipeline.
## Requirements
- [REQ-1]: SKILL.md must have valid YAML frontmatter with name, description, version, and tools (WebSearch, WebFetch)
- [REQ-2]: SKILL.md must reference the ContentResearchOutput schema from packages/shared as the expected output format
- [REQ-3]: Skill must instruct Claude to use WebSearch to find trending topics across specified domains (tech, AI, startups, etc.)
- [REQ-4]: Skill must instruct Claude to use WebFetch to gather details from top search results
- [REQ-5]: Skill must define a relevance scoring methodology (keyword match, recency, source authority) producing scores 0-100
- [REQ-6]: Output must be structured JSON matching ContentResearchOutput schema (topics array with title, relevance score, source count, source URLs, timestamp, summary)
- [REQ-7]: Skill must support configurable parameters: topic domains, time window (default 7 days), result count (default 10)
## Acceptance Criteria
- [ ] [AC-1]: SKILL.md YAML frontmatter passes agentskills.io validation (name, description, tools fields present)
- [ ] [AC-2]: When invoked with "Research trending AI topics", Claude produces valid JSON output with topics array
- [ ] [AC-3]: Each topic in output has a relevance score between 0-100, at least one source URL, and a summary
- [ ] [AC-4]: Output JSON validates against ContentResearchOutput Zod schema without errors
- [ ] [AC-5]: Skill instructions are clear enough for Claude to execute without ambiguity
## Technical Approach
### Files to Create
- `plugin/skills/content-research/SKILL.md` - Full skill definition with YAML frontmatter + markdown instructions
### Files to Modify
- None
### Architecture Notes
- SKILL.md is a markdown file with YAML frontmatter -- it is NOT executable code
- The skill instructs Claude on how to use WebSearch and WebFetch tools to gather data
- Relevance scoring is described as a methodology for Claude to apply (not a programmatic algorithm)
- Output schema is referenced by name so the orchestrator and apps can validate it
- This skill's output feeds into competitor-analysis (Feature 03) via orchestrator prompt forwarding
## Dependencies
- Depends on: 01
- Blocks: 03, 04, 12
## Testing
### Unit Tests
- YAML frontmatter is valid YAML with required fields
- Markdown body contains clear instructions for WebSearch usage
- Output format description matches ContentResearchOutput schema fields
### Integration Tests
- Skill can be discovered by plugin manifest (path matches skills glob)
- When loaded by Claude Code, the skill produces structured output
## Estimated Complexity
medium
