/**
 * Newsletter Analytics - Entry point.
 * Orchestrates: parse -> compute KPIs -> detect anomalies -> output.
 *
 * Usage: npx tsx scripts/index.ts <path-to-metrics-file>
 */

import { readFileSync } from "node:fs";
import { parseMetrics, sortByDate } from "./parse-metrics.js";
import { computeKPIs } from "./compute-kpis.js";
import {
  detectAnomalies,
  computeMovingAverages,
  computePeriodComparisons,
} from "./detect-anomalies.js";

export interface AnalyticsResult {
  kpis: ReturnType<typeof computeKPIs>;
  anomalies: ReturnType<typeof detectAnomalies>;
  timeSeries: Array<{
    date: string;
    sends: number;
    opens: number;
    clicks: number;
    unsubscribes: number;
    revenue: number;
  }>;
  movingAverages: ReturnType<typeof computeMovingAverages>;
  periodComparisons: ReturnType<typeof computePeriodComparisons>;
  analysisDate: string;
  dataRange: { start: string; end: string };
}

/**
 * Run the full analytics pipeline on raw metrics data.
 * @param raw - Raw CSV or JSON string of newsletter metrics
 * @param threshold - Z-score threshold for anomaly detection (default: 2.0)
 */
export function analyzeMetrics(raw: string, threshold = 2.0): AnalyticsResult {
  const parsed = parseMetrics(raw);
  const sorted = sortByDate(parsed);

  const kpis = computeKPIs(sorted);
  const anomalies = detectAnomalies(sorted, threshold);
  const movingAverages = computeMovingAverages(sorted);
  const periodComparisons = computePeriodComparisons(sorted);

  const timeSeries = sorted.map((r) => ({
    date: r.date,
    sends: r.sends,
    opens: r.opens,
    clicks: r.clicks,
    unsubscribes: r.unsubscribes,
    revenue: r.revenue,
  }));

  return {
    kpis,
    anomalies,
    timeSeries,
    movingAverages,
    periodComparisons,
    analysisDate: new Date().toISOString(),
    dataRange: {
      start: sorted[0].date,
      end: sorted[sorted.length - 1].date,
    },
  };
}

// CLI entry point
const filePath = process.argv[2];
if (filePath) {
  const raw = readFileSync(filePath, "utf-8");
  const threshold = process.argv[3] ? Number(process.argv[3]) : 2.0;
  const result = analyzeMetrics(raw, threshold);
  console.log(JSON.stringify(result, null, 2));
}
