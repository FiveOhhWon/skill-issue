# Feature: Project Scaffolding
## Status
pending
## Overview
Initialize the monorepo with npm workspaces, TypeScript configuration, shared package structure, and all directory scaffolding. This is the foundation every subsequent feature builds on.
## Requirements
- [REQ-1]: Root package.json must define npm workspaces with `packages/*` and `apps/*` globs
- [REQ-2]: Root tsconfig.json must use project references pointing to each workspace package
- [REQ-3]: `packages/shared/` must have its own package.json and tsconfig.json with `tsc` for compilation (declarations enabled)
- [REQ-4]: `apps/slack-bot/` and `apps/skillkit/` must have package.json scaffolds with `tsup` as build tool
- [REQ-5]: Plugin directory must contain `.claude-plugin/plugin.json` manifest conforming to agentskills.io standard
- [REQ-6]: Plugin `.mcp.json` must configure HubSpot MCP using `@hubspot/mcp-server` npm with private app token from env
- [REQ-7]: ESLint and Prettier configurations must be present at root level
- [REQ-8]: All required directories must exist: `plugin/skills/`, `plugin/agents/`, `plugin/commands/`, `plugin/hooks/`, `fixtures/`, `docs/`, `examples/`
- [REQ-9]: `.gitignore` must cover node_modules, dist, build, .env, .tsbuildinfo, coverage, IDE files, and logs
## Acceptance Criteria
- [ ] [AC-1]: Running `npm install` from root succeeds and resolves all workspace dependencies
- [ ] [AC-2]: Running `npx tsc --build` from root succeeds (even if no source files yet)
- [ ] [AC-3]: `plugin/.claude-plugin/plugin.json` is valid JSON with required agentskills.io fields (name, version, description, skills glob)
- [ ] [AC-4]: `plugin/.mcp.json` references `@hubspot/mcp-server` with `HUBSPOT_ACCESS_TOKEN` env var
- [ ] [AC-5]: ESLint and Prettier configs parse without errors
- [ ] [AC-6]: All directory paths referenced by Features 01-12 exist
- [ ] [AC-7]: Workspace packages are resolvable from the root (e.g., `packages/shared` can be imported as `@skill-issue/shared`)
## Technical Approach
### Files to Create
- `package.json` - Root package.json with workspaces config, shared devDependencies (typescript, eslint, prettier, tsup)
- `tsconfig.json` - Root tsconfig with project references
- `packages/shared/package.json` - Shared types package config (name: `@skill-issue/shared`)
- `packages/shared/tsconfig.json` - tsc config with declarations
- `packages/shared/src/index.ts` - Barrel export (empty initially)
- `apps/slack-bot/package.json` - Slack bot app config
- `apps/slack-bot/tsconfig.json` - tsup-compatible tsconfig
- `apps/skillkit/package.json` - Skillkit CLI app config
- `apps/skillkit/tsconfig.json` - tsup-compatible tsconfig
- `plugin/.claude-plugin/plugin.json` - agentskills.io plugin manifest
- `plugin/.mcp.json` - MCP server configuration for HubSpot
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration
### Files to Modify
- `.gitignore` - Already exists; verify coverage of all required patterns
### Architecture Notes
- Use npm workspaces (not yarn/pnpm) per tech stack decision
- `packages/shared` compiled with `tsc` for declaration files; apps use `tsup` for bundling
- Plugin manifest must follow agentskills.io spec: `{ "name": "skill-issue", "version": "1.0.0", "skills": "skills/*/SKILL.md" }`
- HubSpot MCP uses local npm server pattern: `{ "hubspot": { "command": "npx", "args": ["@hubspot/mcp-server"], "env": { "HUBSPOT_ACCESS_TOKEN": "${HUBSPOT_ACCESS_TOKEN}" } } }`
## Dependencies
- Depends on: (none)
- Blocks: 01, 02, 03, 04, 05, 06, 07, 08, 09, 10a, 10b, 12
## Testing
### Unit Tests
- Validate package.json workspaces field resolves correctly
- Validate tsconfig.json project references point to existing paths
- Validate plugin.json schema compliance
### Integration Tests
- `npm install` succeeds from clean state
- `npx tsc --build` succeeds
- Cross-workspace imports resolve (e.g., slack-bot can reference @skill-issue/shared)
## Estimated Complexity
medium
