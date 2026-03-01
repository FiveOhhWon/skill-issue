---
name: competitive-scan
description: >
  Runs content-research -> competitor-analysis to identify coverage gaps and
  opportunities relative to competitor newsletters.
version: 1.0.0
agent: newsletter-ops
---

# Competitive Scan

Run a competitive scan to identify what competitors are covering and where the
gaps are.

## Pipeline

Execute these skills in sequence:

1. **content-research** — Research trending topics with a broad scope to capture
   what's happening across the tech and AI landscape.

2. **competitor-analysis** — Using the research output, perform a deep competitor
   coverage analysis. Identify which topics competitors have covered, which they
   missed, and where the best opportunities are.

## Instructions

Run the pipeline with these parameters:
- Topic focus: broad tech/AI scan (unless the user specifies a narrower focus)
- Time window: last 7 days (wider window for competitive context)
- Competitors to analyze: Morning Brew, The Hustle, Pragmatic Engineer, ByteByteGo,
  and any other newsletters in the competitive set

After the pipeline completes, present:
1. Total topics researched and sources scanned
2. Competitor coverage map: which competitors covered which topics
3. Top coverage gaps: high-relevance topics that no competitor has covered
4. Opportunity scores: ranked list of topics by opportunity (high relevance +
   low competitor coverage)

If the user provides a specific focus area (e.g., "competitive scan on AI agents"),
narrow the content-research step accordingly.
