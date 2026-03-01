# Feature: Plugin Orchestration Layer
## Status
pending
## Overview
Orchestrator agent, subagents, and commands that compose individual skills into pipelines via prompt-driven routing. The orchestrator reads one skill's output and feeds it to the next skill as prompt context.
## Requirements
- [REQ-1]: Orchestrator agent (`newsletter-ops.md`) must route natural language requests to appropriate skill pipelines
- [REQ-2]: Orchestrator must support three pipelines: content (02->03->04), sponsor (05->06), and reporting (05->07)
- [REQ-3]: Data analyst subagent (`data-analyst.md`) must handle deep-dive analytics requests
- [REQ-4]: Daily brief command (`daily-brief.md`) must run the content pipeline end-to-end
- [REQ-5]: Sponsor report command (`sponsor-report.md`) must run the sponsor pipeline with HubSpot logging
- [REQ-6]: Competitive scan command (`competitive-scan.md`) must run competitor analysis with trend context
- [REQ-7]: Hooks configuration (`hooks.json`) must define lifecycle hooks for skill execution events
- [REQ-8]: Pipeline composition must work via prompt forwarding: orchestrator reads skill output and includes it in the next skill's prompt
## Acceptance Criteria
- [ ] [AC-1]: Orchestrator agent can be loaded by Claude Code and responds to natural language requests
- [ ] [AC-2]: Running `/daily-brief` equivalent triggers content-research -> competitor-analysis -> content-brief in sequence
- [ ] [AC-3]: Running `/sponsor-report Datadog` equivalent triggers newsletter-analytics -> sponsor-proposals with HubSpot
- [ ] [AC-4]: Running `/competitive-scan` equivalent triggers content-research -> competitor-analysis
- [ ] [AC-5]: Data analyst subagent correctly handles analytics-focused queries
- [ ] [AC-6]: hooks.json is valid JSON defining pre/post execution hooks
- [ ] [AC-7]: Pipeline output from each step is correctly forwarded as context to the next step
## Technical Approach
### Files to Create
- `plugin/agents/newsletter-ops.md` - Orchestrator agent definition with routing logic and pipeline descriptions
- `plugin/agents/data-analyst.md` - Analysis subagent focused on deep-dive analytics
- `plugin/commands/daily-brief.md` - Command that triggers the full content pipeline
- `plugin/commands/sponsor-report.md` - Command that triggers sponsor pipeline with HubSpot integration
- `plugin/commands/competitive-scan.md` - Command that triggers competitor analysis pipeline
- `plugin/hooks/hooks.json` - Lifecycle hooks configuration
### Files to Modify
- None
### Architecture Notes
- Orchestrator is a markdown file that defines Claude's behavior as a routing agent
- It describes available skills, their inputs/outputs, and how to chain them
- Pipeline composition is prompt-driven: orchestrator runs skill A, reads output, includes output in prompt to skill B
- Commands are shortcut entry points that bypass the routing logic and go directly to a specific pipeline
- Data analyst subagent is delegated to by the orchestrator for complex analytics queries
- Hooks enable pre/post actions (e.g., logging, notification) around skill execution
- The orchestrator can start with stubs and work with skill interfaces from Feature 01; full integration testing requires all skills (02-07)
## Dependencies
- Depends on: 01
- Blocks: 09, 12
## Testing
### Unit Tests
- Orchestrator markdown contains routing logic for all three pipelines
- Each command file correctly specifies its pipeline sequence
- hooks.json is valid JSON with recognized event types
### Integration Tests
- Orchestrator correctly routes "create a content brief" to content pipeline
- Orchestrator correctly routes "create a sponsor proposal for X" to sponsor pipeline
- Commands execute their pipelines when invoked
- Skill output forwarding works between pipeline steps
## Estimated Complexity
high
