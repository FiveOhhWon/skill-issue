---
name: daily-brief
description: >
  Runs the full content pipeline end-to-end: content-research -> competitor-analysis
  -> content-brief. Produces a ranked list of stories for today's newsletter edition.
version: 1.0.0
agent: newsletter-ops
---

# Daily Brief

Run the full content pipeline to generate today's newsletter brief.

## Pipeline

Execute these skills in sequence, forwarding each output to the next:

1. **content-research** — Research trending topics across tech, AI, startups,
   and developer ecosystems. Focus on the last 24-48 hours.

2. **competitor-analysis** — Using the research output, analyze what competitors
   (Morning Brew, The Hustle, Pragmatic Engineer, TLDR competitors) have and
   haven't covered. Identify gaps and unique angles.

3. **content-brief** — Using the competitor analysis, generate a ranked content
   brief with 8-12 story candidates. Prioritize stories with high relevance
   scores and low competitor coverage.

## Instructions

Run the content pipeline with these parameters:
- Topic focus: general tech and AI (unless the user specifies otherwise)
- Time window: last 48 hours
- Target stories: 8-12 ranked candidates
- Priority: stories with unique angles that competitors haven't covered

After the pipeline completes, present:
1. A summary of how many topics were researched, competitors analyzed, and
   stories selected
2. The top 3 stories with headlines, angles, and why they were ranked highest
3. The full brief with all story candidates

If the user provides additional context (e.g., "focus on AI safety" or "skip
crypto topics"), pass that as additional instructions to the content-research
step.
