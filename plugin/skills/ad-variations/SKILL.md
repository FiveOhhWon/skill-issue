---
name: ad-variations
version: 1.0.0
description: Analyzes newsletter analytics, advertiser copy, and RFP data to
  generate 3 high-performing ad variations tailored to the advertiser.
tools:
  - Read
  - Write
  - Bash
input_schema:
  newsletter_analytics_path: string
  advertiser_copy_path: string
  advertiser_analytics_path: string
  rfp_path: string
  output_path: string
output_schema:
  ad_variations: object[]
  analysis_summary: string
  success_factors: string[]
composable_with:
  - newsletter-analytics
  - sponsor-proposals
---
## Overview

This skill analyzes newsletter performance data and advertiser information to generate three high-performing ad variations optimized for your specific audience. It synthesizes engagement patterns, advertiser positioning, and RFP requirements to deliver tailored copy with supporting rationales for each variation.

## Usage

```
Use the ad-variations skill to generate optimized ad copy for a sponsor:

Input:
- newsletter_analytics_path: "./analytics.csv"
- advertiser_copy_path: "./advertiser_brief.md"
- advertiser_analytics_path: "./advertiser_metrics.json"
- rfp_path: "./rfp.md"
- output_path: "./ad_variations.json"

Output: Structured JSON with 3 ad variations, analysis summary, and success factors
```

## Steps

1. Read and parse newsletter analytics CSV to identify audience engagement patterns and content preferences
2. Extract key value propositions and performance insights from advertiser copy and historical analytics
3. Analyze RFP document to understand advertiser goals, audience fit, and success criteria
4. Generate 3 distinct ad variations optimized for newsletter audience with supporting rationales
5. Output structured variations with analysis summary and key success factors

## Input

| Field | Type | Description |
|-------|------|-------------|
| newsletter_analytics_path | string | Path to CSV file with audience engagement metrics, content performance, and subscriber demographics |
| advertiser_copy_path | string | Path to markdown/text file with advertiser's existing copy, value propositions, and messaging |
| advertiser_analytics_path | string | Path to JSON/CSV with advertiser's historical performance data and campaign metrics |
| rfp_path | string | Path to RFP document outlining advertiser goals, budget, audience fit criteria, and success metrics |
| output_path | string | Path where output JSON file with ad variations will be written |

## Output

| Field | Type | Description |
|-------|------|-------------|
| ad_variations | object[] | Array of 3 ad variation objects, each containing copy, headline, rationale, and performance guidance |
| analysis_summary | string | Executive summary of audience insights, advertiser positioning, and variation strategy |
| success_factors | string[] | List of key factors (audience hooks, tone, format, timing) critical to ad performance |

## Composability

This skill chains naturally with **newsletter-analytics** to consume upstream audience engagement data and with **sponsor-proposals** to provide ad copy variants for pricing tier customization. The variations generated serve as direct inputs for advertiser review and proposal refinement workflows.
