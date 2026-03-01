"use client";

import { ContentResearchRenderer } from "./content-research";
import { CompetitorAnalysisRenderer } from "./competitor-analysis";
import { ContentBriefRenderer } from "./content-brief";
import { AnalyticsRenderer } from "./analytics";
import { SponsorProposalRenderer } from "./sponsor-proposal";
import { PerformanceReportRenderer } from "./performance-report";
import { SkillkitResultRenderer } from "./skillkit-result";
import { RendererSkeleton, RendererError, RendererEmpty } from "./shared-states";

export type SkillOutputType =
  | "content-research"
  | "competitor-analysis"
  | "content-brief"
  | "newsletter-analytics"
  | "sponsor-proposals"
  | "performance-reports"
  | "skillkit";

/** Attempt to detect the output type from the data shape */
function detectOutputType(data: unknown): SkillOutputType | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  if ("topics" in d && "sourcesAnalyzed" in d) return "content-research";
  if ("competitors" in d && "gaps" in d) return "competitor-analysis";
  if ("stories" in d && "targetEdition" in d) return "content-brief";
  if ("kpis" in d && "timeSeries" in d) return "newsletter-analytics";
  if ("sponsorName" in d && "tiers" in d) return "sponsor-proposals";
  if ("executiveSummary" in d && "topEditions" in d) return "performance-reports";
  if ("skillMd" in d && "review" in d) return "skillkit";

  return null;
}

interface OutputRendererProps {
  type?: SkillOutputType | string;
  data: unknown;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function OutputRenderer({
  type,
  data,
  loading,
  error,
  onRetry,
}: OutputRendererProps) {
  if (loading) {
    return <RendererSkeleton type={type} />;
  }

  if (error) {
    return <RendererError error={error} rawData={data} onRetry={onRetry} />;
  }

  if (!data) {
    return <RendererEmpty />;
  }

  const resolvedType = (type as SkillOutputType) || detectOutputType(data);

  switch (resolvedType) {
    case "content-research":
      return <ContentResearchRenderer data={data as never} />;
    case "competitor-analysis":
      return <CompetitorAnalysisRenderer data={data as never} />;
    case "content-brief":
      return <ContentBriefRenderer data={data as never} />;
    case "newsletter-analytics":
      return <AnalyticsRenderer data={data as never} />;
    case "sponsor-proposals":
      return <SponsorProposalRenderer data={data as never} />;
    case "performance-reports":
      return <PerformanceReportRenderer data={data as never} />;
    case "skillkit":
      return <SkillkitResultRenderer data={data as never} />;
    default:
      // Unknown type — render raw JSON
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {resolvedType
              ? `Unknown renderer type: ${resolvedType}`
              : "Could not determine output type"}
          </p>
          <pre className="max-h-96 overflow-auto rounded-lg bg-code-bg p-4 text-sm text-muted-foreground">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
  }
}
