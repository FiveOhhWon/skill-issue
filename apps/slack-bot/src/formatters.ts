import type {
  ContentResearchOutput,
  SponsorProposalOutput,
  PerformanceReportOutput,
} from '@skill-issue/shared';
import type { SlackBlock, ChunkedBlocks } from './types.js';

// ---------------------------------------------------------------------------
// Markdown -> Slack mrkdwn conversion
// ---------------------------------------------------------------------------

/**
 * Converts standard markdown to Slack mrkdwn format.
 * See design/slack-ux-overview.md for the full conversion table.
 */
export function markdownToMrkdwn(md: string): string {
  let result = md;

  // Bold+italic: ***text*** -> *_text_*
  result = result.replace(/\*\*\*(.*?)\*\*\*/g, '*_$1_*');

  // Bold: **text** -> *text*
  result = result.replace(/\*\*(.*?)\*\*/g, '*$1*');

  // Strikethrough: ~~text~~ -> ~text~
  result = result.replace(/~~(.*?)~~/g, '~$1~');

  // Links: [text](url) -> <url|text>
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>');

  // Images: ![alt](url) -> <url>
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<$2>');

  // Headings: # Heading -> *Heading* (all levels)
  result = result.replace(/^#{1,6}\s+(.+)$/gm, '*$1*');

  // Escape HTML entities that aren't part of Slack syntax
  // Preserve <url|text>, <@U123>, <#C123> patterns
  result = result.replace(/&(?!amp;|lt;|gt;)/g, '&amp;');

  return result;
}

// ---------------------------------------------------------------------------
// Block chunking for Slack message limits
// ---------------------------------------------------------------------------

const SECTION_CHAR_LIMIT = 3000;
const MAX_BLOCKS_PER_MESSAGE = 45;

/**
 * Splits a long mrkdwn string into multiple section blocks at paragraph
 * boundaries, each within the 3000-char Slack limit.
 */
export function splitSectionText(text: string): SlackBlock[] {
  if (text.length <= SECTION_CHAR_LIMIT) {
    return [{ type: 'section', text: { type: 'mrkdwn', text } }];
  }

  const blocks: SlackBlock[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= SECTION_CHAR_LIMIT) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: remaining } });
      break;
    }

    // Find nearest paragraph break before the limit
    const chunk = remaining.slice(0, SECTION_CHAR_LIMIT);
    let breakIdx = chunk.lastIndexOf('\n\n');
    if (breakIdx === -1) breakIdx = chunk.lastIndexOf('\n');
    if (breakIdx === -1) breakIdx = SECTION_CHAR_LIMIT;

    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: remaining.slice(0, breakIdx).trimEnd() },
    });
    remaining = remaining.slice(breakIdx).trimStart();
  }

  return blocks;
}

/**
 * Chunks an array of blocks into primary (channel) and thread portions,
 * respecting the 45-block soft limit per message.
 */
export function chunkBlocks(blocks: SlackBlock[]): ChunkedBlocks {
  if (blocks.length <= MAX_BLOCKS_PER_MESSAGE) {
    return { primary: blocks, thread: [] };
  }

  // Find a logical break point (divider or context block) near the limit
  let breakpoint = MAX_BLOCKS_PER_MESSAGE;
  for (let i = MAX_BLOCKS_PER_MESSAGE - 1; i >= MAX_BLOCKS_PER_MESSAGE - 10; i--) {
    const block = blocks[i];
    if (block && ('type' in block) && (block.type === 'divider' || block.type === 'context')) {
      breakpoint = i;
      break;
    }
  }

  return {
    primary: [
      ...blocks.slice(0, breakpoint),
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: '_Continued in thread..._' }],
      },
    ],
    thread: blocks.slice(breakpoint),
  };
}

/**
 * Generates plain-text fallback for Slack message notifications.
 * Truncates to 150 chars.
 */
export function makeFallbackText(text: string): string {
  const clean = text.replace(/[*_~`<>|]/g, '').replace(/\n+/g, ' ').trim();
  if (clean.length <= 150) return clean;
  return clean.slice(0, 147) + '...';
}

// ---------------------------------------------------------------------------
// Block Kit builders for each skill output type
// ---------------------------------------------------------------------------

/** Relevance score -> emoji color indicator */
function relevanceEmoji(score: number): string {
  if (score >= 80) return ':large_green_circle:';
  if (score >= 50) return ':large_yellow_circle:';
  return ':red_circle:';
}

/**
 * Builds Block Kit layout for content research results.
 * Matches design/slack-ux-content-research.json
 */
export function buildContentResearchBlocks(
  data: ContentResearchOutput,
  sessionId: string,
): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Content Research Results', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Topics Found:* ${data.topics.length}` },
        { type: 'mrkdwn', text: `*Sources Analyzed:* ${data.sourcesAnalyzed}` },
      ],
    },
    { type: 'divider' },
  ];

  // Show top 3 topics in channel, rest in thread
  const displayTopics = data.topics.slice(0, 3);
  for (const topic of displayTopics) {
    const emoji = relevanceEmoji(topic.relevanceScore);
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *${topic.title}*\nRelevance: ${topic.relevanceScore}/100 | ${topic.sourceUrls.length} sources\n${topic.summary}`,
      },
    });
  }

  // Sources context
  const domains = [...new Set(data.topics.map((t) => t.domain))];
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `:newspaper: *Domains:* ${domains.join(', ')}`,
      },
    ],
  });

  if (data.topics.length > 3) {
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `_Showing top 3 of ${data.topics.length} topics. Full results available in thread._`,
      },
    });
  }

  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Generate Brief from These', emoji: true },
        style: 'primary',
        action_id: 'generate_brief',
        value: `research_session_${sessionId}`,
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Refine Search', emoji: true },
        action_id: 'refine_search',
        value: `research_session_${sessionId}`,
      },
    ],
  });

  return blocks;
}

/**
 * Builds Block Kit layout for sponsor proposals.
 * Matches design/slack-ux-sponsor-proposal.json
 */
export function buildSponsorProposalBlocks(
  data: SponsorProposalOutput,
  sessionId: string,
): SlackBlock[] {
  const tierEmojis: Record<string, string> = {
    Standard: ':white_circle:',
    Premium: ':large_blue_circle:',
    Exclusive: ':star:',
  };

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `Sponsor Proposal: ${data.sponsorName}`, emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Audience Fit:* ${data.audienceFit.score}%` },
        {
          type: 'mrkdwn',
          text: `*Recommended CPM:* $${data.tiers.find((t) => t.name === 'Premium')?.cpm ?? 0}`,
        },
      ],
    },
    { type: 'divider' },
  ];

  // Executive summary (first section content)
  const execSection = data.sections.find(
    (s) => s.title.toLowerCase().includes('executive') || s.title.toLowerCase().includes('summary'),
  );
  if (execSection) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Executive Summary*\n${execSection.content}` },
    });
    blocks.push({ type: 'divider' });
  }

  // Tiers
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: '*Sponsorship Tiers*' },
  });

  for (const tier of data.tiers) {
    const emoji = tierEmojis[tier.name] ?? ':white_circle:';
    const weeklyPrice = tier.cpm * (tier.impressions / 1000);
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `${emoji} *${tier.name} Tier*` },
        { type: 'mrkdwn', text: `*$${Math.round(weeklyPrice).toLocaleString()}/week*` },
        { type: 'mrkdwn', text: tier.description },
        { type: 'mrkdwn', text: `Est. ${(tier.impressions / 1000).toFixed(0)}K impressions` },
      ],
    });
  }

  blocks.push({ type: 'divider' });

  // Key metrics
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: '*Key Metrics*' },
    fields: [
      {
        type: 'mrkdwn',
        text: `*Open Rate:*\n${(data.keyMetrics.avgOpenRate * 100).toFixed(1)}%`,
      },
      {
        type: 'mrkdwn',
        text: `*Click-Through Rate:*\n${(data.keyMetrics.avgClickThroughRate * 100).toFixed(1)}%`,
      },
      {
        type: 'mrkdwn',
        text: `*Total Subscribers:*\n${(data.keyMetrics.totalSubscribers / 1e6).toFixed(1)}M`,
      },
    ],
  });

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `:bar_chart: Generated from analytics data | Last updated: ${new Date(data.generatedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      },
    ],
  });

  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Log to HubSpot', emoji: true },
        style: 'primary',
        action_id: 'log_to_hubspot',
        value: `proposal_${data.sponsorName.toLowerCase().replace(/\s+/g, '_')}_${sessionId}`,
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Edit Proposal', emoji: true },
        action_id: 'edit_proposal',
        value: `proposal_${data.sponsorName.toLowerCase().replace(/\s+/g, '_')}_${sessionId}`,
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Send Draft', emoji: true },
        action_id: 'send_draft',
        value: `proposal_${data.sponsorName.toLowerCase().replace(/\s+/g, '_')}_${sessionId}`,
      },
    ],
  });

  return blocks;
}

/**
 * Builds Block Kit layout for performance reports.
 * Matches design/slack-ux-performance-report.json
 */
export function buildPerformanceReportBlocks(
  data: PerformanceReportOutput,
  sessionId: string,
): SlackBlock[] {
  const directionEmoji = (dir: string): string => {
    if (dir === 'up') return ':arrow_up:';
    if (dir === 'down') return ':arrow_down:';
    return ':left_right_arrow:';
  };

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `Performance Report: ${data.dateRange.start} - ${data.dateRange.end}`,
        emoji: true,
      },
    },
  ];

  // KPI metrics fields
  const metricFields = data.metrics.slice(0, 4).map((m) => ({
    type: 'mrkdwn' as const,
    text: `*${m.name}:*\n${m.current} (${directionEmoji(m.direction)} ${m.delta >= 0 ? '+' : ''}${m.delta}%)`,
  }));
  if (metricFields.length > 0) {
    blocks.push({ type: 'section', fields: metricFields });
  }

  blocks.push({ type: 'divider' });

  // Trend summary
  if (data.trends.length > 0) {
    const trendLines = data.trends
      .map((t) => `${directionEmoji(t.direction)} ${t.description}`)
      .join('\n');
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Trend Summary*\n${trendLines}` },
    });
  }

  // Anomalies
  if (data.anomalies.length > 0) {
    const severityEmoji = (s: string): string => {
      if (s === 'high') return ':red_circle:';
      if (s === 'medium') return ':large_yellow_circle:';
      return ':white_circle:';
    };
    const anomalyLines = data.anomalies
      .map(
        (a) =>
          `${severityEmoji(a.severity)} *${a.severity.charAt(0).toUpperCase() + a.severity.slice(1)} Severity:* ${a.description}`,
      )
      .join('\n');
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*:warning: Anomalies Detected*\n${anomalyLines}` },
    });
  }

  // Top editions
  if (data.topEditions.length > 0) {
    const editionLines = data.topEditions
      .slice(0, 5)
      .map(
        (e, i) =>
          `${i + 1}. _${e.subject}_ — ${(e.openRate * 100).toFixed(1)}% open rate, ${(e.clickThroughRate * 100).toFixed(1)}% CTR (${e.date})`,
      )
      .join('\n');
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Top Performing Editions*\n${editionLines}` },
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `:calendar: Report period: ${data.dateRange.start} - ${data.dateRange.end} | Generated: ${new Date(data.generatedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      },
    ],
  });

  const reportId = `report_${data.period}_${sessionId}`;
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Export Full Report', emoji: true },
        style: 'primary',
        action_id: 'export_report',
        value: reportId,
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Compare Periods', emoji: true },
        action_id: 'compare_periods',
        value: reportId,
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Investigate Anomalies', emoji: true },
        action_id: 'investigate_anomalies',
        value: reportId,
      },
    ],
  });

  return blocks;
}

// ---------------------------------------------------------------------------
// Block Kit builder for skillkit forge output
// Matches design/slack-ux-skillkit-flow.json
// ---------------------------------------------------------------------------

/** Input shape matching SkillkitToolOutput from @skill-issue/skillkit */
export interface SkillkitForgeOutput {
  skillMd: string;
  frontmatter: Record<string, unknown> | null;
  review: {
    pass: boolean;
    issues: string[];
    suggestions: string[];
  };
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  stages: Array<{ stage: string; message: string }>;
}

/**
 * Builds Block Kit layout for skillkit forge results.
 * Matches design/slack-ux-skillkit-flow.json Step 4 (final output).
 */
export function buildSkillkitForgeBlocks(
  data: SkillkitForgeOutput,
  sessionId: string,
): SlackBlock[] {
  const fm = data.frontmatter;
  const skillName = (fm?.name as string) ?? 'new-skill';
  const description = (fm?.description as string) ?? '';
  const tools = Array.isArray(fm?.tools) ? (fm.tools as string[]).join(', ') : '';
  const composableWith = Array.isArray(fm?.composable_with)
    ? (fm.composable_with as string[]).join(', ')
    : '';

  // Build YAML frontmatter preview from the raw skillMd
  const fmMatch = data.skillMd.match(/^---\n([\s\S]*?)\n---/);
  const fmPreview = fmMatch ? `---\n${fmMatch[1]}\n---` : '';

  // Review status line
  const allPassed = data.review.pass && data.validation.valid;
  const statusSuffix = allPassed ? ' -- All checks passed' : '';
  const stageStatusLine = ':white_check_mark: Planning | :white_check_mark: Writing | :white_check_mark: Reviewing' + statusSuffix;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `New Skill Created: ${skillName}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          description ? `*Description:* ${description}` : '',
          tools ? `*Tools Used:* ${tools}` : '',
          composableWith ? `*Composable With:* ${composableWith}` : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    },
  ];

  // YAML frontmatter preview code block
  if (fmPreview) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Generated SKILL.md Preview:*\n\`\`\`\n${fmPreview}\n\`\`\``,
      },
    });
  }

  // Review issues/warnings
  if (data.review.issues.length > 0 || data.validation.errors.length > 0) {
    const issueLines = [
      ...data.review.issues.map((i) => `:warning: ${i}`),
      ...data.validation.errors.map((e) => `:x: ${e}`),
    ].join('\n');
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Issues:*\n${issueLines}` },
    });
  }

  // Stage status context
  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: stageStatusLine }],
  });

  // Action buttons matching design spec
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Use Now', emoji: true },
        style: 'primary',
        action_id: 'use_skill',
        value: `use_${skillName}_${sessionId}`,
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Edit Skill', emoji: true },
        action_id: 'edit_skill',
        value: `edit_${skillName}_${sessionId}`,
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'View Full SKILL.md', emoji: true },
        action_id: 'view_skill_md',
        value: `view_${skillName}_${sessionId}`,
      },
    ],
  });

  return blocks;
}

// ---------------------------------------------------------------------------
// Error templates (matching design/slack-ux-overview.md)
// ---------------------------------------------------------------------------

/** Builds error blocks for a skill execution failure */
export function buildSkillErrorBlocks(
  skillName: string,
  errorCode: string,
  message: string,
  sessionId: string,
): SlackBlock[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:x: *${skillName} failed*\n${message}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Skill: ${skillName} | Error: ${errorCode} | Session: ${sessionId}`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Retry' },
          action_id: 'retry_skill',
          value: `${skillName}_${sessionId}`,
        },
      ],
    },
  ];
}

/** Builds error blocks for a pipeline partial failure */
export function buildPipelinePartialFailureBlocks(
  completedSteps: string[],
  failedStep: string,
  message: string,
  sessionId: string,
): SlackBlock[] {
  const stepStatus = [
    ...completedSteps.map((s) => `:white_check_mark: ${s}`),
    `:x: ${failedStep}`,
  ].join(' | ');

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:warning: *Pipeline partially completed*\n${message}`,
      },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: stepStatus }],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Retry Failed Step' },
          style: 'primary',
          action_id: 'retry_step',
          value: `pipeline_${sessionId}_${failedStep}`,
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Partial Results' },
          action_id: 'view_partial',
          value: `pipeline_${sessionId}`,
        },
      ],
    },
  ];
}

/** Builds error blocks for a timeout */
export function buildTimeoutBlocks(skillName: string, sessionId: string): SlackBlock[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':hourglass: *Request timed out*\nThe computation took longer than expected. This can happen with large datasets.',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Retry' },
          action_id: 'retry_skill',
          value: `${skillName}_${sessionId}`,
        },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Onboarding message
// ---------------------------------------------------------------------------

/** Builds the bot onboarding/help message */
export function buildOnboardingBlocks(): SlackBlock[] {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Welcome to Newsletter Ops Bot', emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: "I help you run your newsletter operation with AI-powered skills. Just mention me and describe what you need — I'll figure out which skills to run.\n\nHere's what I can do:",
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':mag: *Content Research*\nFind trending topics relevant to your audience\n_"Research trending AI topics for this week\'s edition"_',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':chart_with_upwards_trend: *Competitor Analysis*\nIdentify coverage gaps vs. competing newsletters\n_"What are Morning Brew and The Hustle covering that we\'re not?"_',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':memo: *Content Briefs*\nGenerate editorial briefs with ranked story candidates\n_"Create a content brief for TLDR Tech #1253"_',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':bar_chart: *Newsletter Analytics*\nAnalyze performance metrics and detect anomalies\n_"Analyze last month\'s newsletter performance"_',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':moneybag: *Sponsor Proposals*\nGenerate data-backed sponsor proposals with CRM integration\n_"Create a sponsor proposal for Datadog"_',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':clipboard: *Performance Reports*\nCreate stakeholder-ready reports for any time period\n_"Generate a monthly performance report for February"_',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':hammer_and_wrench: *Create New Skills*\nBuild custom skills from natural language descriptions\n_"Create a skill that tracks newsletter mentions on social media"_',
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':zap: *Pipelines*\nI can chain skills together automatically. Ask me to _"create a content brief"_ and I\'ll research topics, analyze competitors, and generate the brief — all in one go.',
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Powered by skill-issue | agentskills.io standard | Type *help* anytime to see this again',
        },
      ],
    },
  ];
}
