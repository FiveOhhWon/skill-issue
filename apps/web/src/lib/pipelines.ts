export interface PipelineStep {
  skill: string;
  label: string;
}

export interface PipelineDefinition {
  name: string;
  description: string;
  steps: PipelineStep[];
}

export const PIPELINES: Record<string, PipelineDefinition> = {
  content: {
    name: "Content Pipeline",
    description:
      "Research trending topics, analyze competitor coverage, and generate content briefs",
    steps: [
      { skill: "content-research", label: "Content Research" },
      { skill: "competitor-analysis", label: "Competitor Analysis" },
      { skill: "content-brief", label: "Content Brief" },
    ],
  },
  sponsor: {
    name: "Sponsor Pipeline",
    description: "Analyze newsletter metrics and generate sponsor proposals",
    steps: [
      { skill: "newsletter-analytics", label: "Newsletter Analytics" },
      { skill: "sponsor-proposals", label: "Sponsor Proposal" },
    ],
  },
  reporting: {
    name: "Reporting Pipeline",
    description:
      "Analyze newsletter metrics and generate performance reports",
    steps: [
      { skill: "newsletter-analytics", label: "Newsletter Analytics" },
      { skill: "performance-reports", label: "Performance Report" },
    ],
  },
};

export type PipelineName = keyof typeof PIPELINES;
