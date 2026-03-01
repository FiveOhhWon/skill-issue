# Content Pipeline Example

Demonstrates the full content research pipeline: trending topic discovery, competitor analysis, and editorial brief generation.

## Pipeline

```
content-research -> competitor-analysis -> content-brief
```

## Running via Slack

```
@newsletter-bot Research trending AI topics for this week's edition
```

The bot will:
1. Search for trending topics using WebSearch/WebFetch
2. Analyze competitor coverage to find gaps
3. Generate a ranked editorial brief with story candidates

## Running via Claude Code

In a Claude Code session with the plugin installed:

```
Run the content pipeline for trending AI topics. Focus on developer tools and infrastructure.
```

The orchestrator agent will chain the three skills automatically.

## Expected Output

### Content Research
- Trending topics with relevance scores (0-100)
- Source URLs and timestamps
- Topic domains (e.g., "AI", "DevTools", "Infrastructure")

### Competitor Analysis
- Coverage map showing which competitors cover which topics
- Gap analysis with opportunity scores
- Identified topics with no competitor coverage

### Content Brief
- Ranked stories with headlines and angles
- Source attribution for each story
- Priority levels (P1, P2, P3)
- Suggested publication order

## Sample Data

The pipeline can use fixture data for testing:
- `fixtures/competitor-newsletters.json` -- Competitor profiles and recent topics

## Notes

- The content pipeline produces **Markdown** as final output (the brief)
- Intermediate data between skills is **JSON** (topics, gap analysis)
- The orchestrator handles all data forwarding via prompt context
