import { z } from 'zod';

export const storefrontUpdateSchema = z.object({
  heroTitle: z.string().max(80).optional(),
  heroSubtitle: z.string().max(160).optional(),
  ctaText: z.string().max(40).optional(),
  ctaLink: z.string().max(200).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  backgroundImage: z.string().max(500).optional(),
  bannerImage: z.string().max(500).optional(),
  published: z.boolean().optional(),
  version: z.number().int().optional(),
  theme: z.record(z.string(), z.unknown()).optional(),
  pages: z.array(z.record(z.string(), z.unknown())).optional(),
  activePage: z.string().max(100).optional(),
}).partial();
