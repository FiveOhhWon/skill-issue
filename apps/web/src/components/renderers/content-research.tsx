"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TrendingTopic {
  title: string;
  relevanceScore: number;
  sourceUrls: string[];
  timestamp: string;
  domain: string;
  summary: string;
}

interface ContentResearchData {
  topics: TrendingTopic[];
  researchDate: string;
  sourcesAnalyzed: number;
}

function RelevanceBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green"
      : score >= 50
        ? "bg-warning"
        : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-secondary">
        <div
          className={`h-2 rounded-full ${color} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground">{score}</span>
    </div>
  );
}

export function ContentResearchRenderer({
  data,
}: {
  data: ContentResearchData;
}) {
  return (
    <div className="space-y-4">
      {/* Header metrics */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{data.topics.length} topics found</span>
        <span>{data.sourcesAnalyzed} sources analyzed</span>
        <span>{new Date(data.researchDate).toLocaleDateString()}</span>
      </div>

      {/* Topic cards */}
      <div className="grid gap-3">
        {data.topics.map((topic, i) => (
          <Card key={i} className="transition-colors hover:bg-card-hover">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{topic.title}</CardTitle>
                <Badge variant={topic.domain === "AI" ? "default" : "secondary"}>
                  {topic.domain}
                </Badge>
              </div>
              <CardDescription>{topic.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <RelevanceBar score={topic.relevanceScore} />
              {topic.sourceUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topic.sourceUrls.map((url, j) => (
                    <a
                      key={j}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-cyan hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {new URL(url).hostname}
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
