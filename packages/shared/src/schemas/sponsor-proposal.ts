import { z } from "zod";

export const AudienceFitSchema = z.object({
  score: z.number().min(0).max(100),
  justification: z.string(),
  demographicMatch: z.number().min(0).max(100),
  engagementMatch: z.number().min(0).max(100),
});

export const SponsorTierSchema = z.object({
  name: z.enum(["Standard", "Premium", "Exclusive"]),
  cpm: z.number().nonnegative(),
  impressions: z.number().int().nonnegative(),
  placements: z.array(z.string()),
  description: z.string(),
});

export const ProposalSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
});

export const SponsorProposalOutputSchema = z.object({
  sponsorName: z.string(),
  audienceFit: AudienceFitSchema,
  tiers: z
    .array(SponsorTierSchema)
    .length(3)
    .refine(
      (tiers) => {
        const names = tiers.map((t) => t.name);
        return (
          names.includes("Standard") &&
          names.includes("Premium") &&
          names.includes("Exclusive")
        );
      },
      { message: "Must include Standard, Premium, and Exclusive tiers" }
    ),
  sections: z.array(ProposalSectionSchema).min(1),
  keyMetrics: z.object({
    totalSubscribers: z.number().int().nonnegative(),
    avgOpenRate: z.number().min(0).max(1),
    avgClickThroughRate: z.number().min(0).max(1),
  }),
  generatedDate: z.string().datetime(),
  markdownProposal: z.string(),
});

export type AudienceFit = z.infer<typeof AudienceFitSchema>;
export type SponsorTier = z.infer<typeof SponsorTierSchema>;
export type ProposalSection = z.infer<typeof ProposalSectionSchema>;
export type SponsorProposalOutput = z.infer<
  typeof SponsorProposalOutputSchema
>;
