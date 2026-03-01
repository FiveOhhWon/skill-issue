"use client";

import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PeriodMetric {
  name: string;
  current: number;
  previous: number;
  delta: number;
  direction: "up" | "down" | "stable";
}

interface TrendSummary {
  metric: string;
  direction: "up" | "down" | "stable";
  description: string;
  percentChange: number;
}

interface TopEdition {
  date: string;
  subject: string;
  openRate: number;
  clickThroughRate: number;
  compositeScore: number;
}

interface AnomalyHighlight {
  metric: string;
  date: string;
  description: string;
  severity: "low" | "medium" | "high";
}

interface PerformanceReportData {
  period: string;
  dateRange: string;
  executiveSummary: string;
  metrics: PeriodMetric[];
  trends: TrendSummary[];
  topEditions: TopEdition[];
  anomalies: AnomalyHighlight[];
  generatedDate: string;
}

const dirIcon = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

export function PerformanceReportRenderer({
  data,
}: {
  data: PerformanceReportData;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{data.period}</Badge>
          <span>{data.dateRange}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {data.executiveSummary}
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {data.metrics.map((m) => {
          const Icon = dirIcon[m.direction];
          return (
            <Card key={m.name}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{m.name}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold">
                    {typeof m.current === "number" && m.current < 1
                      ? `${(m.current * 100).toFixed(1)}%`
                      : m.current}
                  </span>
                  <span
                    className={`flex items-center gap-0.5 text-xs ${
                      m.direction === "up"
                        ? "text-green"
                        : m.direction === "down"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {m.delta > 0 ? "+" : ""}
                    {m.delta.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trends */}
      {data.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.trends.map((t, i) => {
                const Icon = dirIcon[t.direction];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg bg-secondary p-3"
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        t.direction === "up"
                          ? "text-green"
                          : t.direction === "down"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1">
                      <span className="font-medium">{t.metric}</span>
                      <p className="text-sm text-muted-foreground">
                        {t.description}
                      </p>
                    </div>
                    <span className="font-mono text-sm">
                      {t.percentChange > 0 ? "+" : ""}
                      {t.percentChange.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top editions */}
      {data.topEditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Editions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">
                      Subject
                    </th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">
                      Open Rate
                    </th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">
                      CTR
                    </th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.topEditions.map((ed, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2">
                        {new Date(ed.date).toLocaleDateString()}
                      </td>
                      <td className="py-2">{ed.subject}</td>
                      <td className="py-2 text-right font-mono">
                        {(ed.openRate * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 text-right font-mono">
                        {(ed.clickThroughRate * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 text-right font-mono text-cyan">
                        {ed.compositeScore.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomalies */}
      {data.anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Anomalies
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
                    <p className="text-sm text-muted-foreground">
                      {a.description}
                    </p>
                  </div>
                  <Badge
                    variant={
                      a.severity === "high"
                        ? "destructive"
                        : a.severity === "medium"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {a.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
