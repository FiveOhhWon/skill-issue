import { z } from "zod";

export const CoverageMapEntrySchema = z.object({
  topic: z.string(),
  covered: z.boolean(),
  depth: z.enum(["shallow", "moderate", "deep"]).optional(),
});

export const CompetitorSchema = z.object({
  name: z.string(),
  coverageMap: z.array(CoverageMapEntrySchema),
  opportunityScore: z.number().min(0).max(100),
});

export const CompetitorAnalysisOutputSchema = z.object({
  competitors: z.array(CompetitorSchema).min(1),
  gaps: z.array(
    z.object({
      topic: z.string(),
      competitorsCovering: z.number().int().nonnegative(),
      opportunityLevel: z.enum(["low", "medium", "high"]),
    })
  ),
  analysisDate: z.string().datetime(),
});

export type CoverageMapEntry = z.infer<typeof CoverageMapEntrySchema>;
export type Competitor = z.infer<typeof CompetitorSchema>;
export type CompetitorAnalysisOutput = z.infer<
  typeof CompetitorAnalysisOutputSchema
>;
