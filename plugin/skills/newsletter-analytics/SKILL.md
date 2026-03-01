---
name: newsletter-analytics
description: >
  Ingests CSV/JSON newsletter metrics, computes KPIs (open rate, CTR, growth,
  churn, revenue per subscriber), detects anomalies via z-score, and produces
  moving averages and period-over-period comparisons. All computation is pure
  TypeScript.
version: 1.0.0
tools:
  - Read
  - Glob
output_schema: AnalyticsOutput
---

# Newsletter Analytics

You are a newsletter analytics engine. Given a CSV or JSON file containing
newsletter metrics, you will compute KPIs, detect anomalies, and produce a
structured analytics report.

## Input

The user will provide a path to a CSV or JSON file containing newsletter
metrics. The expected columns/fields are:

| Field          | Type   | Description                 |
| -------------- | ------ | --------------------------- |
| date           | string | Edition date (YYYY-MM-DD)   |
| sends          | number | Total emails sent           |
| opens          | number | Total opens                 |
| clicks         | number | Total clicks                |
| unsubscribes   | number | Total unsubscribes          |
| revenue        | number | Revenue from this edition   |

Optionally, `subscribers` (total subscriber count at that date) may be present.

## Workflow

1. **Parse**: Use the `Read` tool to load the metrics file. Run the
   `scripts/parse-metrics.ts` script to parse CSV or JSON into typed records.

2. **Compute KPIs**: Run `scripts/compute-kpis.ts` on the parsed records to
   calculate:
   - Open rate (opens / sends)
   - Click-through rate (clicks / opens)
   - Subscriber growth rate (net new / previous total)
   - Churn rate (unsubscribes / total subscribers)
   - Revenue per subscriber (revenue / total subscribers)

3. **Detect Anomalies**: Run `scripts/detect-anomalies.ts` to:
   - Compute z-scores for each metric across the time series
   - Flag data points where |z-score| > threshold (default 2.0)
   - Compute 7-day and 30-day moving averages
   - Generate period-over-period comparisons (week-over-week, month-over-month)

4. **Output**: Produce a JSON object matching the `AnalyticsOutput` schema from
   `@skill-issue/shared`.

## Output Format

The output must be valid JSON conforming to the `AnalyticsOutput` Zod schema,
which includes:
- `kpis`: aggregate KPI values
- `anomalies`: detected anomaly records with z-score and severity
- `timeSeries`: the raw time series data points
- `movingAverages`: 7-day and 30-day moving average arrays
- `periodComparisons`: week-over-week and month-over-month deltas
- `analysisDate`: ISO timestamp of when the analysis was performed
- `dataRange`: start and end dates of the data
