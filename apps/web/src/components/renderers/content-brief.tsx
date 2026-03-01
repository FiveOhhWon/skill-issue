"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Story {
  headline: string;
  angle: string;
  sourceAttribution: string[];
  priority: "low" | "medium" | "high" | "critical";
  estimatedEngagement?: number;
}

interface ContentBriefData {
  stories: Story[];
  briefDate: string;
  targetEdition: string;
  recommendedLeadStory: string;
}

const priorityConfig = {
  critical: { variant: "destructive" as const, label: "Critical" },
  high: { variant: "warning" as const, label: "High" },
  medium: { variant: "default" as const, label: "Medium" },
  low: { variant: "secondary" as const, label: "Low" },
};

export function ContentBriefRenderer({ data }: { data: ContentBriefData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Target: {data.targetEdition}</span>
        <span>{new Date(data.briefDate).toLocaleDateString()}</span>
        <Badge variant="cyan">Lead: {data.recommendedLeadStory}</Badge>
      </div>

      <div className="space-y-3">
        {data.stories.map((story, i) => {
          const pc = priorityConfig[story.priority];
          return (
            <Card
              key={i}
              className={`transition-colors hover:bg-card-hover ${
                story.headline === data.recommendedLeadStory
                  ? "ring-1 ring-cyan/30"
                  : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {story.headline}
                    </CardTitle>
                    <CardDescription>{story.angle}</CardDescription>
                  </div>
                  <Badge variant={pc.variant}>{pc.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {story.sourceAttribution.map((src, j) => (
                      <span
                        key={j}
                        className="text-xs text-muted-foreground"
                      >
                        {src}
                        {j < story.sourceAttribution.length - 1 && " · "}
                      </span>
                    ))}
                  </div>
                  {story.estimatedEngagement !== undefined && (
                    <span className="text-xs font-mono text-cyan">
                      ~{story.estimatedEngagement}% engagement
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
