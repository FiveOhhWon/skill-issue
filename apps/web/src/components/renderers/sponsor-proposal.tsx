"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SponsorTier {
  name: "Standard" | "Premium" | "Exclusive";
  cpm: number;
  impressions: number;
  placements: string[];
  description: string;
}

interface SponsorProposalData {
  sponsorName: string;
  audienceFit: {
    score: number;
    justification: string;
    demographicMatch: number;
    engagementMatch: number;
  };
  tiers: SponsorTier[];
  sections: { title: string; content: string }[];
  keyMetrics: {
    totalSubscribers: number;
    avgOpenRate: number;
    avgClickThroughRate: number;
  };
  generatedDate: string;
}

const tierColor = {
  Standard: "secondary",
  Premium: "default",
  Exclusive: "warning",
} as const;

function FitGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-green" : score >= 50 ? "text-cyan" : "text-warning";
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-secondary"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            className={color}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${color}`}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

export function SponsorProposalRenderer({
  data,
}: {
  data: SponsorProposalData;
}) {
  return (
    <div className="space-y-6">
      {/* Header with audience fit */}
      <div className="flex items-start gap-6">
        <FitGauge score={data.audienceFit.score} />
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold">{data.sponsorName}</h3>
          <p className="text-sm text-muted-foreground">
            {data.audienceFit.justification}
          </p>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              Demo match:{" "}
              <span className="text-foreground">
                {data.audienceFit.demographicMatch}%
              </span>
            </span>
            <span className="text-muted-foreground">
              Engagement match:{" "}
              <span className="text-foreground">
                {data.audienceFit.engagementMatch}%
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {data.keyMetrics.totalSubscribers.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Subscribers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {(data.keyMetrics.avgOpenRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Open Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {(data.keyMetrics.avgClickThroughRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg CTR</p>
          </CardContent>
        </Card>
      </div>

      {/* Tiers */}
      <div className="grid gap-3 md:grid-cols-3">
        {data.tiers.map((tier) => (
          <Card key={tier.name} className={tier.name === "Premium" ? "ring-1 ring-primary/30" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{tier.name}</CardTitle>
                <Badge variant={tierColor[tier.name]}>${tier.cpm} CPM</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {tier.description}
              </p>
              <div className="text-sm">
                <p className="font-mono text-cyan">
                  {tier.impressions.toLocaleString()} impressions
                </p>
              </div>
              <div className="space-y-1">
                {tier.placements.map((p, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sections */}
      {data.sections.map((section, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {section.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
