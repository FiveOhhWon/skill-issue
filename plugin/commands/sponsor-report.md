---
name: sponsor-report
description: >
  Runs the sponsor pipeline: newsletter-analytics -> sponsor-proposals with
  HubSpot CRM logging. Requires a sponsor/company name as argument.
version: 1.0.0
agent: newsletter-ops
---

# Sponsor Report

Generate a data-backed sponsor proposal and log it to HubSpot CRM.

## Pipeline

Execute these skills in sequence:

1. **newsletter-analytics** — Analyze the latest newsletter metrics to compute
   KPIs (open rate, CTR, growth, churn, revenue per subscriber).

2. **sponsor-proposals** — Using the analytics output and the specified sponsor
   name, generate a complete sponsorship proposal with audience fit scoring,
   three pricing tiers (Standard, Premium, Exclusive), and HubSpot CRM logging.

## Instructions

The user must provide a sponsor/company name. If not provided, ask for it before
proceeding.

Run the pipeline with these parameters:
- Metrics file: use `Glob` to find the most recent metrics file in `fixtures/`
  (pattern: `fixtures/*metrics*` or `fixtures/*analytics*`)
- Sponsor name: from the user's input (e.g., `/sponsor-report Datadog`)

After the pipeline completes, present:
1. The audience fit score and justification
2. The three pricing tiers with CPM, impressions, and total cost
3. Key newsletter metrics backing the proposal
4. Confirmation that the proposal was logged to HubSpot (deal created, note attached)

If HubSpot logging fails (e.g., no API token configured), still present the
proposal and note that CRM logging was skipped.
