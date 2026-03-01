# Demo Script: skill-issue Platform

**Duration**: 10 minutes
**Audience**: Hiring managers, technical leads, product managers

## Setup Checklist

Before the demo:
- [ ] Slack workspace with bot installed and active
- [ ] `.env` configured with all tokens (Slack, HubSpot, Anthropic)
- [ ] Fixture data in `fixtures/` directory
- [ ] Terminal open in project root
- [ ] Slack channel open in browser/app
- [ ] HubSpot dashboard open (for Act 3)

## Act 1: Content Pipeline (3 minutes)

**Goal**: Show the full content research pipeline producing an editorial brief.

### Script

1. **In Slack**, type:
   ```
   @newsletter-bot Research trending AI topics for this week's edition
   ```

2. **Show**: Progress indicators updating in-place (Planning -> Researching -> Analyzing)

3. **Show**: Content research results with:
   - Trending topics with relevance scores
   - Source URLs and timestamps
   - "Generate Brief" action button

4. **Click**: "Generate Brief" button

5. **Show**: Pipeline progress (Research -> Competitor Analysis -> Brief Generation)

6. **Show**: Final content brief with:
   - Ranked stories with headlines and angles
   - Source attribution
   - Priority levels

### Talking Points

- "The bot chains three skills automatically -- research, competitor analysis, and brief generation"
- "Each skill's output feeds into the next via prompt-driven orchestration"
- "Non-technical editors can run this entire pipeline from Slack"

### Fallback

If the pipeline is slow, switch to pre-generated output:
```
@newsletter-bot help
```
This shows all available skills and demonstrates the onboarding flow.

## Act 2: Analytics and Reporting (2 minutes)

**Goal**: Show analytics computation and performance reporting.

### Script

1. **In Slack**, type:
   ```
   @newsletter-bot Analyze last month's newsletter performance
   ```

2. **Show**: Analytics results with:
   - KPIs (open rate, CTR, growth, churn, revenue)
   - Anomaly detection with severity indicators
   - Moving averages and trends

3. **In Slack**, type:
   ```
   @newsletter-bot Generate a monthly performance report
   ```

4. **Show**: Performance report with:
   - Executive summary
   - KPI grid with directional arrows
   - Trend descriptions
   - Top performing editions
   - Anomaly highlights

### Talking Points

- "All analytics computation is pure TypeScript -- z-scores, moving averages, period comparisons"
- "The same analytics output feeds both sponsor proposals and performance reports"
- "Reports are formatted for stakeholders with actionable insights"

## Act 3: Sponsor Pipeline with HubSpot (2 minutes)

**Goal**: Show sponsor proposal generation with CRM integration.

### Script

1. **In Slack**, type:
   ```
   @newsletter-bot Create a sponsor proposal for Datadog
   ```

2. **Show**: Proposal with:
   - Audience fit score and reasoning
   - CPM tiers (Standard, Premium, Exclusive)
   - Historical performance data
   - Action buttons (Log to HubSpot, Edit Proposal, Send Draft)

3. **Click**: "Log to HubSpot" button

4. **Show**: HubSpot dashboard with the new deal and proposal note

### Talking Points

- "The proposal is data-backed -- it uses real analytics and sponsor history"
- "CPM tiers are automatically calculated based on audience fit and placement type"
- "One click logs the deal to HubSpot via MCP integration"

### Fallback

If HubSpot is unavailable, show the proposal output and explain the CRM integration:
- "In production, this creates a deal and attaches the proposal as a note"
- Show the HubSpot MCP configuration in `plugin/.mcp.json`

## Act 4: Skillkit Live Demo (3 minutes)

**Goal**: Generate a new skill live, demonstrating the meta-capability.

### Script

1. **In terminal**, run:
   ```bash
   npx skillkit --describe "Track newsletter influence across social media platforms" --name influence-tracker
   ```

2. **Show**: Progress output:
   ```
   > Planning
     Writing
     Reviewing
     Validating
   ```

3. **Show**: Generated `SKILL.md` with:
   - Valid YAML frontmatter
   - Tools list (WebSearch, WebFetch)
   - Input/output schemas
   - Workflow steps

4. **Show**: Validation results (PASSED)

5. **Optional (from Slack)**:
   ```
   @newsletter-bot Create a skill that monitors competitor pricing changes
   ```

6. **Show**: Same flow but through Slack with the skillkit Block Kit UI

### Talking Points

- "Skillkit uses a three-agent pipeline -- planner, writer, reviewer"
- "Each agent is a Claude invocation with specialized prompts"
- "The generated skill is immediately usable -- it follows agentskills.io standard"

### Risk Mitigation

Act 4 depends on live AI generation, which can be unpredictable:
- **Pre-generate a backup**: Run skillkit before the demo and save the output
- **Have the SKILL.md ready**: If generation fails, show the pre-generated file
- **Time buffer**: Acts 1-3 may run faster than scripted, giving Act 4 more time

## Closing (30 seconds)

### Key Takeaways

1. **Composable skills** -- Individual capabilities chain into powerful pipelines
2. **Three surfaces** -- Same skills accessible from Claude Code, Slack, and CLI
3. **agentskills.io standard** -- Skills are portable, discoverable, and self-documenting
4. **Meta-capability** -- The platform can generate new skills for itself

### CTA

- "The full source is on GitHub with documentation and example pipelines"
- "Check out the authoring guide to create your own skills"
