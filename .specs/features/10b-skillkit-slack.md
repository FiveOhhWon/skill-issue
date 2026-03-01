# Feature: Skillkit Slack Integration (MCP Tool)
## Status
pending
## Overview
In-process MCP tool that registers skillkit as a Slack-accessible tool, enabling skill generation from Slack conversations.
## Requirements
- [REQ-1]: `mcp-tool.ts` must use `createSdkMcpServer` + `tool()` from Agent SDK to register a skillkit MCP tool
- [REQ-2]: MCP tool must accept a skill description and name as input parameters
- [REQ-3]: MCP tool must invoke the skillkit forge pipeline and return the generated SKILL.md
- [REQ-4]: Slack bot MCP server configuration must include the skillkit MCP tool
- [REQ-5]: Slack output must follow the skillkit flow design spec in `design/slack-ux-skillkit-flow.json`
## Acceptance Criteria
- [ ] [AC-1]: MCP tool is registered and discoverable by the Slack bot's Agent SDK session
- [ ] [AC-2]: Slack user can say "create a skill that tracks social mentions" and get a generated SKILL.md
- [ ] [AC-3]: Skill generation progress shows multi-step flow (Planning -> Writing -> Reviewing) matching design spec
- [ ] [AC-4]: Generated skill preview is displayed in Slack with YAML frontmatter code block
- [ ] [AC-5]: Action buttons (Use Now, Edit Skill, View Full SKILL.md) are present in the output
## Technical Approach
### Files to Create
- `apps/skillkit/src/mcp-tool.ts` - createSdkMcpServer + tool() registration wrapping forge pipeline
### Files to Modify
- `apps/slack-bot/src/claude-handler.ts` - Add skillkit MCP server to mcpServers configuration
### Architecture Notes
- The MCP tool is an in-process server created with `createSdkMcpServer` from Agent SDK
- It wraps the existing forge.ts pipeline, exposing it as a callable MCP tool
- The Slack bot adds this MCP server to its `mcpServers` config so Claude can invoke it
- Progress updates from the forge pipeline are forwarded to the Slack progress system
- Output formatting reuses the skillkit Block Kit builder from formatters.ts
- This is a thin integration layer -- all logic lives in skillkit core (10a) and slack bot (09)
## Dependencies
- Depends on: 09, 10a
- Blocks: 12
## Testing
### Unit Tests
- MCP tool registration creates a valid tool with correct input schema
- Tool invocation calls forge pipeline with correct parameters
### Integration Tests
- Slack bot discovers and can invoke the skillkit MCP tool
- End-to-end: Slack message -> MCP tool -> forge pipeline -> formatted Slack output
## Estimated Complexity
low
