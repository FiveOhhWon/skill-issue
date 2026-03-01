"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CoverageMapEntry {
  topic: string;
  covered: boolean;
  depth?: "shallow" | "moderate" | "deep";
}

interface Competitor {
  name: string;
  coverageMap: CoverageMapEntry[];
  opportunityScore: number;
}

interface Gap {
  topic: string;
  competitorsCovering: number;
  opportunityLevel: string;
}

interface CompetitorAnalysisData {
  competitors: Competitor[];
  gaps: Gap[];
  analysisDate: string;
}

const depthColor = {
  shallow: "text-warning",
  moderate: "text-cyan",
  deep: "text-green",
};

export function CompetitorAnalysisRenderer({
  data,
}: {
  data: CompetitorAnalysisData;
}) {
  // Get all unique topics
  const allTopics = Array.from(
    new Set(data.competitors.flatMap((c) => c.coverageMap.map((e) => e.topic)))
  );

  return (
    <div className="space-y-6">
      {/* Coverage gap matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coverage Gap Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">
                    Topic
                  </th>
                  {data.competitors.map((c) => (
                    <th
                      key={c.name}
                      className="pb-2 px-3 text-center font-medium text-muted-foreground"
                    >
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allTopics.map((topic) => (
                  <tr key={topic} className="border-b border-border/50">
                    <td className="py-2 pr-4">{topic}</td>
                    {data.competitors.map((c) => {
                      const entry = c.coverageMap.find(
                        (e) => e.topic === topic
                      );
                      return (
                        <td key={c.name} className="py-2 px-3 text-center">
                          {entry?.covered ? (
                            <span
                              className={
                                entry.depth
                                  ? depthColor[entry.depth]
                                  : "text-green"
                              }
                            >
                              {entry.depth || "covered"}
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Opportunity scores */}
      <div className="grid gap-3 sm:grid-cols-2">
        {data.competitors.map((c) => (
          <Card key={c.name}>
            <CardContent className="flex items-center justify-between p-4">
              <span className="font-medium">{c.name}</span>
              <Badge
                variant={
                  c.opportunityScore >= 70
                    ? "success"
                    : c.opportunityScore >= 40
                      ? "warning"
                      : "secondary"
                }
              >
                Opportunity: {c.opportunityScore}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gaps */}
      {data.gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identified Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.gaps.map((gap, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-secondary p-3"
                >
                  <span>{gap.topic}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {gap.competitorsCovering} covering
                    </span>
                    <Badge variant="cyan">{gap.opportunityLevel}</Badge>
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
