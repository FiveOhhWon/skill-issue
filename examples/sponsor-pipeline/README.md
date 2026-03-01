# Sponsor Pipeline Example

Demonstrates the sponsor proposal pipeline: newsletter analytics, proposal generation with CPM tiers, and HubSpot CRM integration.

## Pipeline

```
newsletter-analytics -> sponsor-proposals -> HubSpot MCP
```

## Running via Slack

```
@newsletter-bot Create a sponsor proposal for Datadog
```

The bot will:
1. Analyze newsletter performance metrics
2. Generate a data-backed sponsor proposal
3. Offer to log the proposal to HubSpot

## Running via Claude Code

In a Claude Code session with the plugin installed:

```
Generate a sponsor proposal for Vercel based on our newsletter analytics. Use the Premium tier.
```

## Expected Output

### Newsletter Analytics
- KPIs: open rate, CTR, subscriber growth, churn, revenue per subscriber
- Anomaly detection with z-scores and severity levels
- Period-over-period comparisons (WoW, MoM)

### Sponsor Proposal
- Audience fit score with reasoning
- CPM tiers:
  - **Standard** ($30-40 CPM): Secondary slot, 150-word copy, 1 link
  - **Premium** ($40-55 CPM): Primary slot, 250-word copy, 2 links, CTA
  - **Exclusive** ($55-75 CPM): Full edition, custom content, 3 links, subject mention
- Historical performance data (if returning sponsor)
- Projected reach and engagement estimates

### HubSpot Integration
- Creates or updates a deal in the CRM
- Logs the proposal as a note on the deal
- Sets deal stage based on sponsor response

## Sample Data

- `fixtures/newsletter-metrics.csv` -- 90 days of newsletter metrics
- `fixtures/sponsor-profiles.json` -- Sponsor profiles with history and budgets

## Prerequisites

- HubSpot private app token in `HUBSPOT_ACCESS_TOKEN` environment variable
- `@hubspot/mcp-server` configured in `plugin/.mcp.json`
