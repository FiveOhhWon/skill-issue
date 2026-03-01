/**
 * KPI computation for newsletter metrics.
 * Calculates: open rate, click-through rate, subscriber growth rate,
 * churn rate, and revenue per subscriber.
 */

import type { MetricRecord } from "./parse-metrics.js";

export interface KPIResult {
  openRate: number;
  clickThroughRate: number;
  subscriberGrowthRate: number;
  churnRate: number;
  revenuePerSubscriber: number;
}

/**
 * Compute aggregate KPIs across all metric records.
 *
 * - openRate: total opens / total sends
 * - clickThroughRate: total clicks / total opens
 * - subscriberGrowthRate: net growth over the period / starting subscriber count
 * - churnRate: total unsubscribes / average subscriber count
 * - revenuePerSubscriber: total revenue / average subscriber count
 */
export function computeKPIs(records: MetricRecord[]): KPIResult {
  if (records.length === 0) {
    throw new Error("Cannot compute KPIs from empty record set");
  }

  const totalSends = records.reduce((sum, r) => sum + r.sends, 0);
  const totalOpens = records.reduce((sum, r) => sum + r.opens, 0);
  const totalClicks = records.reduce((sum, r) => sum + r.clicks, 0);
  const totalUnsubs = records.reduce((sum, r) => sum + r.unsubscribes, 0);
  const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);

  // Estimate subscriber count from sends if not explicitly provided
  const subscriberCounts = records.map((r) => r.subscribers ?? r.sends);
  const avgSubscribers =
    subscriberCounts.reduce((sum, s) => sum + s, 0) / subscriberCounts.length;
  const firstSubscribers = subscriberCounts[0];
  const lastSubscribers = subscriberCounts[subscriberCounts.length - 1];

  const openRate = totalSends > 0 ? totalOpens / totalSends : 0;
  const clickThroughRate = totalOpens > 0 ? totalClicks / totalOpens : 0;
  const subscriberGrowthRate =
    firstSubscribers > 0
      ? (lastSubscribers - firstSubscribers) / firstSubscribers
      : 0;
  const churnRate = avgSubscribers > 0 ? totalUnsubs / avgSubscribers : 0;
  const revenuePerSubscriber =
    avgSubscribers > 0 ? totalRevenue / avgSubscribers : 0;

  return {
    openRate,
    clickThroughRate,
    subscriberGrowthRate,
    churnRate,
    revenuePerSubscriber,
  };
}

/**
 * Compute per-record KPIs (for time series analysis).
 */
export function computePerRecordKPIs(
  records: MetricRecord[]
): Array<{ date: string; openRate: number; clickThroughRate: number }> {
  return records.map((r) => ({
    date: r.date,
    openRate: r.sends > 0 ? r.opens / r.sends : 0,
    clickThroughRate: r.opens > 0 ? r.clicks / r.opens : 0,
  }));
}
