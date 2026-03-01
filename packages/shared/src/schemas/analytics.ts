import { z } from "zod";

export const KPIsSchema = z.object({
  openRate: z.number().min(0).max(1),
  clickThroughRate: z.number().min(0).max(1),
  subscriberGrowthRate: z.number(),
  churnRate: z.number().min(0).max(1),
  revenuePerSubscriber: z.number().nonnegative(),
});

export const AnomalySchema = z.object({
  metric: z.string(),
  value: z.number(),
  zScore: z.number(),
  date: z.string(),
  severity: z.enum(["low", "medium", "high"]),
});

export const TimeSeriesPointSchema = z.object({
  date: z.string(),
  sends: z.number().int().nonnegative(),
  opens: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  unsubscribes: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
});

export const MovingAveragesSchema = z.object({
  sevenDay: z.array(
    z.object({
      date: z.string(),
      openRate: z.number(),
      clickThroughRate: z.number(),
    })
  ),
  thirtyDay: z.array(
    z.object({
      date: z.string(),
      openRate: z.number(),
      clickThroughRate: z.number(),
    })
  ),
});

export const PeriodComparisonSchema = z.object({
  period: z.enum(["week-over-week", "month-over-month"]),
  current: KPIsSchema,
  previous: KPIsSchema,
  deltas: z.object({
    openRate: z.number(),
    clickThroughRate: z.number(),
    subscriberGrowthRate: z.number(),
    churnRate: z.number(),
    revenuePerSubscriber: z.number(),
  }),
});

export const AnalyticsOutputSchema = z.object({
  kpis: KPIsSchema,
  anomalies: z.array(AnomalySchema),
  timeSeries: z.array(TimeSeriesPointSchema),
  movingAverages: MovingAveragesSchema,
  periodComparisons: z.array(PeriodComparisonSchema),
  analysisDate: z.string().datetime(),
  dataRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

export type KPIs = z.infer<typeof KPIsSchema>;
export type Anomaly = z.infer<typeof AnomalySchema>;
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;
export type MovingAverages = z.infer<typeof MovingAveragesSchema>;
export type PeriodComparison = z.infer<typeof PeriodComparisonSchema>;
export type AnalyticsOutput = z.infer<typeof AnalyticsOutputSchema>;
