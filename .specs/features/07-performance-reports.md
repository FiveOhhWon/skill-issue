# Feature: Performance Reports Skill
## Status
pending
## Overview
Formats analytics data into stakeholder-ready reports with configurable time periods. Consumes AnalyticsOutput from newsletter-analytics.
## Requirements
- [REQ-1]: SKILL.md must have valid YAML frontmatter with name, description, and version
- [REQ-2]: SKILL.md must reference PerformanceReportOutput schema as expected output format
- [REQ-3]: Skill must consume AnalyticsOutput from newsletter-analytics as input context
- [REQ-4]: Reports must support three time periods: weekly, monthly, quarterly
- [REQ-5]: Each report must include an executive summary with key takeaways
- [REQ-6]: Reports must include trend descriptions (text-based, no charts) for key metrics
- [REQ-7]: Period-over-period comparisons must show deltas with directional indicators (up/down arrows)
- [REQ-8]: Reports must identify top-performing editions with metrics
- [REQ-9]: Anomaly highlights from analytics must be surfaced with severity levels
- [REQ-10]: Output must be markdown formatted for stakeholder consumption
## Acceptance Criteria
- [ ] [AC-1]: SKILL.md YAML frontmatter passes agentskills.io validation
- [ ] [AC-2]: When given analytics output with period=monthly, skill produces a complete monthly report
- [ ] [AC-3]: Executive summary captures the 3-5 most important trends/events
- [ ] [AC-4]: Period comparisons show correct directional indicators and delta values
- [ ] [AC-5]: Top performing editions are ranked by composite metric (open rate + CTR)
- [ ] [AC-6]: Anomalies from analytics are surfaced with severity indicators (high/medium/low)
- [ ] [AC-7]: Slack Block Kit rendering matches design spec in `design/slack-ux-performance-report.json`
- [ ] [AC-8]: Output validates against PerformanceReportOutput Zod schema
## Technical Approach
### Files to Create
- `plugin/skills/performance-reports/SKILL.md` - Skill definition with YAML frontmatter + instructions
### Files to Modify
- None
### Architecture Notes
- Consumes analytics output via orchestrator prompt forwarding
- Report format is primarily markdown prose with embedded metrics
- Period selection is passed as a parameter: "weekly", "monthly", or "quarterly"
- Executive summary is Claude-generated narrative, not templated
- Trend descriptions use natural language (e.g., "Open rates continue a 3-month upward trend") rather than chart placeholders
- Block Kit layout for Slack follows design spec: header with period, fields grid for KPIs with arrows, trend summary section, anomalies section, top editions list, and action buttons
- Anomaly section is omitted entirely if no anomalies detected (graceful degradation per design principles)
## Dependencies
- Depends on: 01, 05
- Blocks: 12
## Testing
### Unit Tests
- YAML frontmatter is valid with required fields
- Instructions define all three report periods
- Output format matches PerformanceReportOutput schema fields
### Integration Tests
- Skill produces valid report for each period type (weekly, monthly, quarterly)
- Report content reflects actual data from analytics output
## Estimated Complexity
medium
