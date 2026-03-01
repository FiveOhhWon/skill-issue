import { z } from "zod";

export const StorySchema = z.object({
  headline: z.string(),
  angle: z.string(),
  sourceAttribution: z.array(z.string()),
  priority: z.enum(["low", "medium", "high", "critical"]),
  estimatedEngagement: z.number().min(0).max(100).optional(),
});

export const ContentBriefOutputSchema = z.object({
  stories: z.array(StorySchema).min(1),
  briefDate: z.string().datetime(),
  targetEdition: z.string(),
  recommendedLeadStory: z.string(),
});

export type Story = z.infer<typeof StorySchema>;
export type ContentBriefOutput = z.infer<typeof ContentBriefOutputSchema>;
