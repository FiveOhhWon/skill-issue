import { z } from "zod";

export const TrendingTopicSchema = z.object({
  title: z.string(),
  relevanceScore: z.number().min(0).max(100),
  sourceUrls: z.array(z.string().url()),
  timestamp: z.string().datetime(),
  domain: z.string(),
  summary: z.string(),
});

export const ContentResearchOutputSchema = z.object({
  topics: z.array(TrendingTopicSchema).min(1),
  researchDate: z.string().datetime(),
  sourcesAnalyzed: z.number().int().nonnegative(),
});

export type TrendingTopic = z.infer<typeof TrendingTopicSchema>;
export type ContentResearchOutput = z.infer<typeof ContentResearchOutputSchema>;
