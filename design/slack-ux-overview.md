# Slack Bot UX Design Specifications

Comprehensive Block Kit UX specifications for the skill-issue Slack bot. All JSON files are valid Slack Block Kit payloads testable at https://app.slack.com/block-kit-builder.

---

## Design Specifications

| File | Description |
|------|-------------|
| [slack-ux-content-research.json](./slack-ux-content-research.json) | Content research results layout |
| [slack-ux-sponsor-proposal.json](./slack-ux-sponsor-proposal.json) | Sponsor proposal with tiers and CRM actions |
| [slack-ux-performance-report.json](./slack-ux-performance-report.json) | Performance report with metrics and anomalies |
| [slack-ux-skillkit-flow.json](./slack-ux-skillkit-flow.json) | Multi-step skillkit generation conversation flow |
| [slack-ux-pipeline-progress.json](./slack-ux-pipeline-progress.json) | Pipeline progress indicators with in-place updates |

---

## Design Principles

1. **Consistent formatting** -- Every skill output follows the same structural pattern: Header, summary fields, divider, detail sections, context footer, action buttons. Users learn the pattern once and can scan any output quickly.

2. **Progress visibility** -- Long-running pipelines always show progress. Users see which step is active, which are complete, and which are pending. Progress messages update in-place via `chat.update` to avoid channel noise.

3. **Actionable outputs** -- Every output includes contextual action buttons. The bot never dumps data without offering a next step. Actions are skill-aware: research results offer "Generate Brief", proposals offer "Log to HubSpot", etc.

4. **Information density without clutter** -- Use Slack's `fields` layout for key metrics (2-column grid). Reserve full-width `text` sections for prose content. Use `context` blocks for metadata that is useful but secondary.

5. **Graceful degradation** -- If a section has no data (e.g., no anomalies detected), omit the block entirely rather than showing an empty section. Errors are surfaced inline with severity indicators.

---

## Markdown-to-mrkdwn Conversion Rules

The Slack bot receives Claude markdown output and must convert it to Slack mrkdwn format before posting. These rules are implemented in `apps/slack-bot/src/formatters.ts`.

| Markdown | Slack mrkdwn | Notes |
|----------|-------------|-------|
| `**bold**` | `*bold*` | Slack uses single asterisks for bold |
| `*italic*` or `_italic_` | `_italic_` | Slack uses underscores for italic |
| `~~strikethrough~~` | `~strikethrough~` | Single tildes in Slack |
| `[text](url)` | `<url\|text>` | Slack link format; pipe-delimit display text |
| `# Heading` | `*Heading*` | No heading syntax in mrkdwn; use bold on its own line |
| `## Subheading` | `*Subheading*` | Same treatment for all heading levels |
| `` `code` `` | `` `code` `` | Inline code is identical |
| ```` ```code block``` ```` | ```` ```code block``` ```` | Code blocks are identical |
| `> blockquote` | `> blockquote` | Blockquotes are identical |
| `- list item` | `- list item` | Unordered lists render correctly as-is |
| `1. item` | `1. item` | Ordered lists render correctly as-is |
| `---` | (use divider block) | Horizontal rules become Block Kit divider blocks |
| `![alt](url)` | `<url>` | Images become plain links (or use image blocks) |

### Special Cases

- **Nested bold/italic**: `***bold italic***` becomes `*_bold italic_*` in mrkdwn
- **HTML entities**: Strip any `<`, `>`, `&` that are not part of link syntax (escape as `&lt;`, `&gt;`, `&amp;`)
- **Emoji shortcodes**: Pass through as-is (`:emoji_name:` works in both formats)
- **User/channel mentions**: Preserve `<@U123>` and `<#C123>` Slack mention format

---

## Message Length Handling Strategy

Slack imposes hard limits on message content. The bot must handle these gracefully.

### Limits

| Constraint | Limit |
|-----------|-------|
| `text` field in section block | 3,000 characters |
| `text` field in `chat.postMessage` | 4,000 characters (fallback text) |
| Blocks per message | 50 blocks |
| Attachments per message | 100 |

### Chunking Strategy

1. **Section block text**: If a section's mrkdwn content exceeds 3,000 characters, split it at the nearest paragraph break (`\n\n`) before the limit. Create a new section block for the overflow.

2. **Total blocks per message**: If the total block count exceeds 45 (leaving headroom), truncate the primary message at a logical boundary and add a context block: `"Continued in thread..."`. Post remaining blocks as a threaded reply.

3. **Threaded follow-ups**: For very long outputs (e.g., full content briefs with 10+ stories), post the summary in the channel and the full details as a threaded reply. The channel message includes a "View Full Results" button or text indicating thread continuation.

4. **Fallback text**: Always provide a plain-text `text` field alongside `blocks` for notification previews and accessibility. Truncate to 150 characters with `...` suffix.

### Implementation

```
// Pseudocode for chunking
function chunkBlocks(blocks: Block[]): { primary: Block[], thread: Block[] } {
  if (blocks.length <= 45) return { primary: blocks, thread: [] };

  const breakpoint = findLogicalBreak(blocks, 45);
  return {
    primary: [
      ...blocks.slice(0, breakpoint),
      makeContextBlock("Continued in thread...")
    ],
    thread: blocks.slice(breakpoint)
  };
}
```

---

## Error State Templates

### Skill Execution Error

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":x: *Content research failed*\nThe web search returned no results for the specified topic domains. This may be a temporary connectivity issue."
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Skill: content-research | Error: NO_RESULTS | Session: abc123"
        }
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Retry"
          },
          "action_id": "retry_skill",
          "value": "content-research_abc123"
        }
      ]
    }
  ]
}
```

### Pipeline Partial Failure

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":warning: *Pipeline partially completed*\nThe content pipeline completed 2 of 3 steps. Brief generation failed due to insufficient competitor data."
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": ":white_check_mark: Research topics | :white_check_mark: Analyze competitors | :x: Generate brief"
        }
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Retry Failed Step"
          },
          "style": "primary",
          "action_id": "retry_step",
          "value": "pipeline_abc123_step_3"
        },
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Partial Results"
          },
          "action_id": "view_partial",
          "value": "pipeline_abc123"
        }
      ]
    }
  ]
}
```

### Rate Limit / Timeout

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":hourglass: *Request timed out*\nThe analytics computation took longer than expected. This can happen with large datasets."
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Retry"
          },
          "action_id": "retry_skill",
          "value": "newsletter-analytics_abc123"
        }
      ]
    }
  ]
}
```

---

## Bot Onboarding Message

Sent when the bot is first added to a channel or when a user sends "help".

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Welcome to Newsletter Ops Bot",
        "emoji": true
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "I help you run your newsletter operation with AI-powered skills. Just mention me and describe what you need — I'll figure out which skills to run.\n\nHere's what I can do:"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":mag: *Content Research*\nFind trending topics relevant to your audience\n_\"Research trending AI topics for this week's edition\"_"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":chart_with_upwards_trend: *Competitor Analysis*\nIdentify coverage gaps vs. competing newsletters\n_\"What are Morning Brew and The Hustle covering that we're not?\"_"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":memo: *Content Briefs*\nGenerate editorial briefs with ranked story candidates\n_\"Create a content brief for TLDR Tech #1253\"_"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":bar_chart: *Newsletter Analytics*\nAnalyze performance metrics and detect anomalies\n_\"Analyze last month's newsletter performance\"_"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":moneybag: *Sponsor Proposals*\nGenerate data-backed sponsor proposals with CRM integration\n_\"Create a sponsor proposal for Datadog\"_"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":clipboard: *Performance Reports*\nCreate stakeholder-ready reports for any time period\n_\"Generate a monthly performance report for February\"_"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":hammer_and_wrench: *Create New Skills*\nBuild custom skills from natural language descriptions\n_\"Create a skill that tracks newsletter mentions on social media\"_"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":zap: *Pipelines*\nI can chain skills together automatically. Ask me to _\"create a content brief\"_ and I'll research topics, analyze competitors, and generate the brief — all in one go."
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Powered by skill-issue | agentskills.io standard | Type *help* anytime to see this again"
        }
      ]
    }
  ]
}
```

---

## Implementation Notes for formatters.ts

### Block Kit Builder Testing

All JSON files in this directory can be pasted directly into https://app.slack.com/block-kit-builder for visual testing. For the multi-step files (`slack-ux-skillkit-flow.json`, `slack-ux-pipeline-progress.json`), test each step's `blocks` array individually.

### chat.update Pattern

Progress indicators and skillkit flows use Slack's `chat.update` API to modify messages in-place. The implementation pattern:

1. Post initial message with `chat.postMessage` -- save the returned `ts` (timestamp)
2. For each progress update, call `chat.update` with the same `channel` and `ts`
3. Throttle updates to max 1 per second to respect Slack rate limits
4. Final output replaces the progress message entirely

### Action Handler Routing

Action button `action_id` values follow the pattern `{verb}_{noun}` (e.g., `generate_brief`, `log_to_hubspot`, `retry_skill`). The `value` field carries the session or entity identifier needed to execute the action.

### Thread Strategy

- Single skill outputs: Post in channel
- Pipeline outputs: Summary in channel, full details in thread
- Errors: Post in channel (visible to team)
- Follow-up conversations: Always in thread to avoid channel noise
