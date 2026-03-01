"use client";

import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface KPIs {
  openRate: number;
  clickThroughRate: number;
  subscriberGrowthRate: number;
  churnRate: number;
  revenuePerSubscriber: number;
}

interface Anomaly {
  metric: string;
  value: number;
  zScore: number;
  date: string;
  severity: "low" | "medium" | "high";
}

interface PeriodComparison {
  period: string;
  current: KPIs;
  previous: KPIs;
  deltas: KPIs;
}

interface AnalyticsData {
  kpis: KPIs;
  anomalies: Anomaly[];
  timeSeries: unknown[];
  movingAverages: unknown;
  periodComparisons: PeriodComparison[];
  analysisDate: string;
  dataRange: string;
}

function KPICard({
  label,
  value,
  format,
  delta,
}: {
  label: string;
  value: number;
  format: "percent" | "currency" | "number";
  delta?: number;
}) {
  const formatted =
    format === "percent"
      ? `${(value * 100).toFixed(1)}%`
      : format === "currency"
        ? `$${value.toFixed(2)}`
        : value.toFixed(2);

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold">{formatted}</span>
          {delta !== undefined && (
            <span
              className={`flex items-center gap-0.5 text-xs ${
                delta > 0
                  ? "text-green"
                  : delta < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
              {delta > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : delta < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {delta > 0 ? "+" : ""}
              {(delta * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsRenderer({ data }: { data: AnalyticsData }) {
  const comparison = data.periodComparisons[0];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KPICard
          label="Open Rate"
          value={data.kpis.openRate}
          format="percent"
          delta={comparison?.deltas.openRate}
        />
        <KPICard
          label="Click-Through Rate"
          value={data.kpis.clickThroughRate}
          format="percent"
          delta={comparison?.deltas.clickThroughRate}
        />
        <KPICard
          label="Growth Rate"
          value={data.kpis.subscriberGrowthRate}
          format="number"
          delta={comparison?.deltas.subscriberGrowthRate}
        />
        <KPICard
          label="Churn Rate"
          value={data.kpis.churnRate}
          format="percent"
        />
        <KPICard
          label="Revenue / Sub"
          value={data.kpis.revenuePerSubscriber}
          format="currency"
        />
      </div>

      {/* Anomalies */}
      {data.anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.anomalies.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-secondary p-3"
                >
                  <div>
                    <span className="font-medium">{a.metric}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {new Date(a.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{a.value}</span>
                    <Badge
                      variant={
                        a.severity === "high"
                          ? "destructive"
                          : a.severity === "medium"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      z={a.zScore.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period comparisons */}
      {data.periodComparisons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Period Comparisons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.periodComparisons.map((pc, i) => (
                <div key={i} className="rounded-lg bg-secondary p-3">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    {pc.period}
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Open Rate</p>
                      <p>
                        {(pc.current.openRate * 100).toFixed(1)}% vs{" "}
                        {(pc.previous.openRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CTR</p>
                      <p>
                        {(pc.current.clickThroughRate * 100).toFixed(1)}% vs{" "}
                        {(pc.previous.clickThroughRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rev/Sub</p>
                      <p>
                        ${pc.current.revenuePerSubscriber.toFixed(2)} vs $
                        {pc.previous.revenuePerSubscriber.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
