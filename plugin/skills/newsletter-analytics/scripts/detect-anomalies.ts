/**
 * Anomaly detection, moving averages, and period-over-period comparison.
 * Uses z-score based method with configurable threshold.
 * All math is native TypeScript -- no external libraries.
 */

import type { MetricRecord } from "./parse-metrics.js";
import { computeKPIs } from "./compute-kpis.js";

export interface Anomaly {
  metric: string;
  value: number;
  zScore: number;
  date: string;
  severity: "low" | "medium" | "high";
}

export interface MovingAveragePoint {
  date: string;
  openRate: number;
  clickThroughRate: number;
}

export interface MovingAverages {
  sevenDay: MovingAveragePoint[];
  thirtyDay: MovingAveragePoint[];
}

export interface PeriodComparison {
  period: "week-over-week" | "month-over-month";
  current: ReturnType<typeof computeKPIs>;
  previous: ReturnType<typeof computeKPIs>;
  deltas: {
    openRate: number;
    clickThroughRate: number;
    subscriberGrowthRate: number;
    churnRate: number;
    revenuePerSubscriber: number;
  };
}

// --- Math utilities ---

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function zScore(value: number, avg: number, sd: number): number {
  if (sd === 0) return 0;
  return (value - avg) / sd;
}

// --- Anomaly detection ---

type MetricExtractor = (r: MetricRecord) => number;

const METRICS: Array<{ name: string; extract: MetricExtractor }> = [
  { name: "openRate", extract: (r) => (r.sends > 0 ? r.opens / r.sends : 0) },
  {
    name: "clickThroughRate",
    extract: (r) => (r.opens > 0 ? r.clicks / r.opens : 0),
  },
  { name: "unsubscribes", extract: (r) => r.unsubscribes },
  { name: "revenue", extract: (r) => r.revenue },
];

function severityFromZScore(z: number): "low" | "medium" | "high" {
  const abs = Math.abs(z);
  if (abs >= 3) return "high";
  if (abs >= 2.5) return "medium";
  return "low";
}

/**
 * Detect anomalies across all tracked metrics using z-score.
 * @param records - Sorted metric records
 * @param threshold - Z-score threshold for flagging anomalies (default: 2.0)
 */
export function detectAnomalies(
  records: MetricRecord[],
  threshold = 2.0
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (const metric of METRICS) {
    const values = records.map(metric.extract);
    const avg = mean(values);
    const sd = stddev(values);

    for (let i = 0; i < records.length; i++) {
      const z = zScore(values[i], avg, sd);
      if (Math.abs(z) >= threshold) {
        anomalies.push({
          metric: metric.name,
          value: values[i],
          zScore: Math.round(z * 100) / 100,
          date: records[i].date,
          severity: severityFromZScore(z),
        });
      }
    }
  }

  return anomalies;
}

// --- Moving averages ---

/**
 * Compute moving averages for open rate and CTR over given window sizes.
 */
export function computeMovingAverages(
  records: MetricRecord[]
): MovingAverages {
  return {
    sevenDay: computeWindowedAverage(records, 7),
    thirtyDay: computeWindowedAverage(records, 30),
  };
}

function computeWindowedAverage(
  records: MetricRecord[],
  windowSize: number
): MovingAveragePoint[] {
  const results: MovingAveragePoint[] = [];

  for (let i = windowSize - 1; i < records.length; i++) {
    const window = records.slice(i - windowSize + 1, i + 1);

    const openRates = window.map((r) =>
      r.sends > 0 ? r.opens / r.sends : 0
    );
    const ctrs = window.map((r) => (r.opens > 0 ? r.clicks / r.opens : 0));

    results.push({
      date: records[i].date,
      openRate: Math.round(mean(openRates) * 10000) / 10000,
      clickThroughRate: Math.round(mean(ctrs) * 10000) / 10000,
    });
  }

  return results;
}

// --- Period-over-period comparison ---

/**
 * Split records into two halves and compare KPIs for period-over-period analysis.
 * Supports week-over-week (last 14 days split in half) and month-over-month
 * (last 60 days split in half).
 */
export function computePeriodComparisons(
  records: MetricRecord[]
): PeriodComparison[] {
  const comparisons: PeriodComparison[] = [];

  // Week-over-week: compare last 7 days vs previous 7 days
  if (records.length >= 14) {
    const recent7 = records.slice(-7);
    const previous7 = records.slice(-14, -7);
    comparisons.push(buildComparison("week-over-week", previous7, recent7));
  }

  // Month-over-month: compare last 30 days vs previous 30 days
  if (records.length >= 60) {
    const recent30 = records.slice(-30);
    const previous30 = records.slice(-60, -30);
    comparisons.push(buildComparison("month-over-month", previous30, recent30));
  }

  return comparisons;
}

function buildComparison(
  period: "week-over-week" | "month-over-month",
  previousRecords: MetricRecord[],
  currentRecords: MetricRecord[]
): PeriodComparison {
  const current = computeKPIs(currentRecords);
  const previous = computeKPIs(previousRecords);

  return {
    period,
    current,
    previous,
    deltas: {
      openRate:
        Math.round((current.openRate - previous.openRate) * 10000) / 10000,
      clickThroughRate:
        Math.round(
          (current.clickThroughRate - previous.clickThroughRate) * 10000
        ) / 10000,
      subscriberGrowthRate:
        Math.round(
          (current.subscriberGrowthRate - previous.subscriberGrowthRate) * 10000
        ) / 10000,
      churnRate:
        Math.round((current.churnRate - previous.churnRate) * 10000) / 10000,
      revenuePerSubscriber:
        Math.round(
          (current.revenuePerSubscriber - previous.revenuePerSubscriber) * 100
        ) / 100,
    },
  };
}
