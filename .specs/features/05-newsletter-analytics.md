# Feature: Newsletter Analytics Skill
## Status
pending
## Overview
Ingests CSV/JSON newsletter metrics, computes KPIs, and detects anomalies -- all in TypeScript (no Python). This skill anchors the analytics/sponsor/reporting pipeline.
## Requirements
- [REQ-1]: SKILL.md must have valid YAML frontmatter with name, description, version, and tools (Read, Glob)
- [REQ-2]: SKILL.md must reference AnalyticsOutput schema as expected output format
- [REQ-3]: TypeScript scripts in `scripts/` directory must handle CSV and JSON ingestion and parsing
- [REQ-4]: KPI computation must include: open rate, click-through rate, subscriber growth rate, churn rate, revenue per subscriber
- [REQ-5]: Anomaly detection must use z-score based method with configurable threshold (default: 2.0 standard deviations)
- [REQ-6]: Moving averages must be computed (7-day and 30-day windows)
- [REQ-7]: Time series analysis must support period-over-period comparison (week-over-week, month-over-month)
- [REQ-8]: All computation must be pure TypeScript -- no Python, no external math libraries required (90-day datasets are trivial for JS)
- [REQ-9]: Output must be structured JSON matching AnalyticsOutput schema
## Acceptance Criteria
- [ ] [AC-1]: SKILL.md YAML frontmatter passes agentskills.io validation
- [ ] [AC-2]: Given a CSV file with newsletter metrics, skill produces KPI summary with all 5 required metrics
- [ ] [AC-3]: Anomaly detection flags data points where z-score exceeds threshold (verified with known anomalous data)
- [ ] [AC-4]: Moving averages are correctly computed for 7-day and 30-day windows
- [ ] [AC-5]: Period-over-period comparison shows correct deltas (e.g., open rate change from last month)
- [ ] [AC-6]: TypeScript scripts compile without errors and run with `tsx` or `ts-node`
- [ ] [AC-7]: Output validates against AnalyticsOutput Zod schema
## Technical Approach
### Files to Create
- `plugin/skills/newsletter-analytics/SKILL.md` - Skill definition with YAML frontmatter + instructions
- `plugin/skills/newsletter-analytics/scripts/parse-metrics.ts` - CSV/JSON parser with type-safe column mapping
- `plugin/skills/newsletter-analytics/scripts/compute-kpis.ts` - KPI calculation functions (open rate, CTR, growth, churn, RPS)
- `plugin/skills/newsletter-analytics/scripts/detect-anomalies.ts` - Z-score anomaly detection + moving averages
- `plugin/skills/newsletter-analytics/scripts/index.ts` - Entry point that orchestrates parse -> compute -> detect
### Files to Modify
- None
### Architecture Notes
- Scripts are TypeScript files that Claude runs via the skill instructions (not compiled into a binary)
- CSV parsing: use simple split-based parser (no external deps needed for well-formatted CSVs)
- Z-score formula: `(value - mean) / stddev` -- trivial to implement in TS
- Moving average: sliding window sum / window size
- 90-day datasets (~2700 data points) are well within JS performance limits
- Scripts export functions for testability; index.ts provides CLI-like entry point
- The SKILL.md instructs Claude to run these scripts via the Read tool and process the output
## Dependencies
- Depends on: 01
- Blocks: 06, 07, 12
## Testing
### Unit Tests
- CSV parser handles standard newsletter metric CSVs (date, sends, opens, clicks, unsubs, revenue)
- KPI calculations are mathematically correct for known test data
- Z-score detection correctly identifies injected anomalies in test datasets
- Moving averages match hand-calculated values for small windows
- Period comparison correctly computes deltas
### Integration Tests
- End-to-end: CSV file in -> AnalyticsOutput JSON out
- Skill works with sample fixture data from `fixtures/newsletter-metrics.csv`
## Estimated Complexity
high
