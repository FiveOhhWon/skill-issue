import { z } from "zod";

export const TrendSummarySchema = z.object({
  metric: z.string(),
  direction: z.enum(["up", "down", "stable"]),
  description: z.string(),
  percentChange: z.number(),
});

export const TopEditionSchema = z.object({
  date: z.string(),
  subject: z.string(),
  openRate: z.number().min(0).max(1),
  clickThroughRate: z.number().min(0).max(1),
  compositeScore: z.number(),
});

export const AnomalyHighlightSchema = z.object({
  metric: z.string(),
  date: z.string(),
  description: z.string(),
  severity: z.enum(["low", "medium", "high"]),
});

export const PeriodMetricSchema = z.object({
  name: z.string(),
  current: z.number(),
  previous: z.number(),
  delta: z.number(),
  direction: z.enum(["up", "down", "stable"]),
});

export const PerformanceReportOutputSchema = z.object({
  period: z.enum(["weekly", "monthly", "quarterly"]),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  executiveSummary: z.string(),
  metrics: z.array(PeriodMetricSchema),
  trends: z.array(TrendSummarySchema),
  topEditions: z.array(TopEditionSchema),
  anomalies: z.array(AnomalyHighlightSchema),
  generatedDate: z.string().datetime(),
  markdownReport: z.string(),
});

export type TrendSummary = z.infer<typeof TrendSummarySchema>;
export type TopEdition = z.infer<typeof TopEditionSchema>;
export type AnomalyHighlight = z.infer<typeof AnomalyHighlightSchema>;
export type PeriodMetric = z.infer<typeof PeriodMetricSchema>;
export type PerformanceReportOutput = z.infer<
  typeof PerformanceReportOutputSchema
>;
