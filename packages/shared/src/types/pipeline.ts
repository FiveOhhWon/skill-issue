import type { ContentResearchOutput } from "../schemas/content-research.js";
import type { CompetitorAnalysisOutput } from "../schemas/competitor-analysis.js";
import type { ContentBriefOutput } from "../schemas/content-brief.js";
import type { AnalyticsOutput } from "../schemas/analytics.js";
import type { SponsorProposalOutput } from "../schemas/sponsor-proposal.js";
import type { PerformanceReportOutput } from "../schemas/performance-report.js";

/**
 * Pipeline step definitions that enforce type-safe chaining between skills.
 *
 * Content pipeline: ContentResearch -> CompetitorAnalysis -> ContentBrief
 * Sponsor pipeline: Analytics -> SponsorProposal
 * Reporting pipeline: Analytics -> PerformanceReport
 */

export interface PipelineStep<TInput, TOutput> {
  readonly name: string;
  readonly inputType: TInput;
  readonly outputType: TOutput;
}

export type ContentResearchStep = PipelineStep<void, ContentResearchOutput>;
export type CompetitorAnalysisStep = PipelineStep<
  ContentResearchOutput,
  CompetitorAnalysisOutput
>;
export type ContentBriefStep = PipelineStep<
  CompetitorAnalysisOutput,
  ContentBriefOutput
>;
export type AnalyticsStep = PipelineStep<void, AnalyticsOutput>;
export type SponsorProposalStep = PipelineStep<
  AnalyticsOutput,
  SponsorProposalOutput
>;
export type PerformanceReportStep = PipelineStep<
  AnalyticsOutput,
  PerformanceReportOutput
>;

/** Maps skill name to its input type */
export interface PipelineInputMap {
  "content-research": void;
  "competitor-analysis": ContentResearchOutput;
  "content-brief": CompetitorAnalysisOutput;
  "newsletter-analytics": void;
  "sponsor-proposals": AnalyticsOutput;
  "performance-reports": AnalyticsOutput;
}

/** Maps skill name to its output type */
export interface PipelineOutputMap {
  "content-research": ContentResearchOutput;
  "competitor-analysis": CompetitorAnalysisOutput;
  "content-brief": ContentBriefOutput;
  "newsletter-analytics": AnalyticsOutput;
  "sponsor-proposals": SponsorProposalOutput;
  "performance-reports": PerformanceReportOutput;
}

/** Type-safe pipeline input lookup */
export type PipelineInput<T extends keyof PipelineInputMap> =
  PipelineInputMap[T];

/** Type-safe pipeline output lookup */
export type PipelineOutput<T extends keyof PipelineOutputMap> =
  PipelineOutputMap[T];
