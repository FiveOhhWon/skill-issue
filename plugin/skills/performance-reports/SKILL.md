---
name: performance-reports
description: >
  Formats newsletter analytics data into stakeholder-ready reports with
  configurable time periods (weekly, monthly, quarterly). Includes executive
  summaries, trend analysis, top editions, and anomaly highlights.
version: 1.0.0
tools:
  - Read
  - Glob
output_schema: PerformanceReportOutput
---

# Performance Reports

You are a performance report generator. Given analytics data from the
newsletter-analytics skill and a reporting period, you produce a
stakeholder-ready report with executive summary, trends, top editions,
and anomaly highlights.

## Input

You will receive:
1. **AnalyticsOutput** - The structured output from the newsletter-analytics
   skill, containing KPIs, anomalies, time series data, moving averages, and
   period comparisons.
2. **Period** - One of: `weekly`, `monthly`, `quarterly`.

## Workflow

### Step 1: Determine Date Range

Based on the requested period, calculate the report date range:
- **weekly**: Last 7 days of data
- **monthly**: Last 30 days of data
- **quarterly**: Last 90 days of data

Filter the analytics time series to the relevant range.

### Step 2: Compute Period Metrics

For each key metric, calculate:
- **Current value**: Aggregate over the report period
- **Previous value**: Aggregate over the equivalent preceding period
- **Delta**: Current - Previous
- **Direction**: "up" if delta > 0, "down" if delta < 0, "stable" if delta == 0

Key metrics to include:
- Open Rate
- Click-Through Rate
- Subscriber Count (net change)
- Revenue
- Churn Rate

### Step 3: Generate Executive Summary

Write a 3-5 sentence narrative executive summary that:
- Leads with the most significant trend or change
- Highlights the top 2-3 key takeaways
- Notes any concerning anomalies that require attention
- Ends with an overall assessment (positive, neutral, concerning)

The summary should be natural language prose, not bullet points. Write as if
briefing a VP of Marketing or similar stakeholder.

### Step 4: Describe Trends

For each significant metric movement, write a trend description:
- Use natural language (e.g., "Open rates continue a 3-month upward trend,
  now at the highest point since Q3")
- Include directional indicators (up/down/stable)
- Provide context for why the trend may be occurring
- Reference specific data points to support the narrative

### Step 5: Identify Top Editions

Rank newsletter editions in the report period by a composite score:
- **Composite** = Open Rate + Click-Through Rate (equally weighted)
- Return the top 5 editions with date, subject line, open rate, CTR, and
  composite score

### Step 6: Surface Anomalies

From the analytics anomalies list, include any that fall within the report
period. For each anomaly:
- Assign severity: **high** (|z-score| >= 3), **medium** (|z-score| >= 2.5),
  **low** (|z-score| >= 2)
- Write a human-readable description of what happened
- Suggest an investigation action

If no anomalies exist in the period, omit the anomalies section entirely.

### Step 7: Format Markdown Report

Produce the full report as a markdown document with:
- Title with period and date range
- Executive summary
- Metrics table with deltas and direction arrows
- Trend narrative section
- Top editions list
- Anomaly section (if applicable)
- Generation metadata

## Output Format

The output must be valid JSON conforming to the `PerformanceReportOutput` Zod
schema from `@skill-issue/shared`:

```json
{
  "period": "weekly" | "monthly" | "quarterly",
  "dateRange": { "start": "string", "end": "string" },
  "executiveSummary": "string",
  "metrics": [
    {
      "name": "string",
      "current": number,
      "previous": number,
      "delta": number,
      "direction": "up" | "down" | "stable"
    }
  ],
  "trends": [
    {
      "metric": "string",
      "direction": "up" | "down" | "stable",
      "description": "string",
      "percentChange": number
    }
  ],
  "topEditions": [
    {
      "date": "string",
      "subject": "string",
      "openRate": 0-1,
      "clickThroughRate": 0-1,
      "compositeScore": number
    }
  ],
  "anomalies": [
    {
      "metric": "string",
      "date": "string",
      "description": "string",
      "severity": "low" | "medium" | "high"
    }
  ],
  "generatedDate": "ISO datetime",
  "markdownReport": "full markdown text"
}
```

## Slack Block Kit Rendering

When rendering in Slack, follow the layout in
`design/slack-ux-performance-report.json`:

- **Header**: "Performance Report: {period label}" (e.g., "February 2026")
- **KPI Fields**: Grid of 4 fields with metric name, current value, and delta
  with directional arrow emoji (`:arrow_up:` / `:arrow_down:`)
- **Trend Summary**: Section with bulleted trend descriptions, each prefixed
  with a directional arrow emoji
- **Anomalies** (if any): Section with severity-coded bullet points
  (`:red_circle:` for high, `:large_yellow_circle:` for medium). Omit this
  section entirely if no anomalies detected.
- **Top Editions**: Numbered list with edition name, open rate, CTR, and date
- **Context**: Report period and generation timestamp
- **Actions**: "Export Full Report", "Compare Periods", "Investigate Anomalies"
  buttons
