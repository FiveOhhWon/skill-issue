# Feature: Sponsor Proposals Skill
## Status
pending
## Overview
Generates data-backed sponsor proposals with audience fit scoring, CPM pricing, and tier options. Integrates with HubSpot for CRM logging via MCP.
## Requirements
- [REQ-1]: SKILL.md must have valid YAML frontmatter with name, description, version, and tools (mcp__hubspot__*)
- [REQ-2]: SKILL.md must reference SponsorProposalOutput schema as expected output format
- [REQ-3]: Skill must consume AnalyticsOutput from newsletter-analytics as input context
- [REQ-4]: Audience fit scoring must evaluate demographic match and engagement metrics to produce a 0-100 score
- [REQ-5]: CPM pricing model must define three tiers: Standard (single placement), Premium (multi-newsletter + dedicated), Exclusive (full network takeover)
- [REQ-6]: Skill must instruct Claude to use HubSpot MCP tools: search contacts, create deals, create notes
- [REQ-7]: Output must be markdown proposal with structured data section for programmatic use
- [REQ-8]: Proposal must include executive summary, audience alignment, tier pricing table, and key metrics
## Acceptance Criteria
- [ ] [AC-1]: SKILL.md YAML frontmatter passes agentskills.io validation
- [ ] [AC-2]: When given analytics output and a sponsor name, skill produces a complete proposal
- [ ] [AC-3]: Proposal includes audience fit score (0-100) with justification
- [ ] [AC-4]: All three CPM tiers are present with pricing, impressions, and placement details
- [ ] [AC-5]: HubSpot integration instructions are clear (search for existing contact, create deal, log proposal as note)
- [ ] [AC-6]: Output validates against SponsorProposalOutput Zod schema
- [ ] [AC-7]: Slack Block Kit rendering matches design spec in `design/slack-ux-sponsor-proposal.json`
## Technical Approach
### Files to Create
- `plugin/skills/sponsor-proposals/SKILL.md` - Skill definition with YAML frontmatter + instructions including HubSpot MCP usage
### Files to Modify
- None
### Architecture Notes
- Consumes analytics output via orchestrator prompt forwarding
- HubSpot MCP tools are available at runtime when the plugin MCP config is active
- The skill instructs Claude on the HubSpot workflow: (1) search for sponsor contact, (2) create deal with tier/pricing, (3) log proposal as note on the deal
- CPM pricing is based on newsletter metrics from analytics output (subscriber count, open rate, historical CTR)
- Audience fit scoring considers: sponsor's target demographic vs. newsletter audience, category alignment, historical sponsor performance
- Block Kit layout for Slack rendering follows the design spec with header, fields (fit score, CPM), tiers section, metrics section, and action buttons
## Dependencies
- Depends on: 01, 05
- Blocks: 12
## Testing
### Unit Tests
- YAML frontmatter is valid with required fields
- Instructions include HubSpot MCP tool usage patterns
- Output format matches SponsorProposalOutput schema fields
- Tier definitions include all three levels with required fields
### Integration Tests
- Skill produces valid proposal when given sample AnalyticsOutput
- HubSpot MCP integration: skill instructions lead to correct tool invocations
## Estimated Complexity
high
