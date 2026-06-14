import { z } from 'zod';

/** A lookalike species and how to tell it apart. */
export const lookalikeSchema = z.object({
  name: z.string(),
  distinction: z.string(),
});

/** A source citation. `url` is optional — many references are books/journals. */
export const citationSchema = z.object({
  title: z.string(),
  url: z.string().optional(),
});

/**
 * The structured reference-page content. Mirrors the `species_reference` fields in the
 * spec. The model is asked to return exactly this shape; we validate with Zod and retry
 * once on failure before surfacing an error.
 */
export const referenceContentSchema = z.object({
  summary: z.string(),
  taxonomy: z.string(),
  synonyms: z.array(z.string()),
  nativeRange: z.string(),
  habitat: z.string(),
  identifyingFeatures: z.array(z.string()),
  lookalikes: z.array(lookalikeSchema),
  edibility: z.string(),
  medicinalActions: z.array(z.string()),
  constituents: z.array(z.string()),
  preparations: z.array(z.string()),
  contraindications: z.array(z.string()),
  drugInteractions: z.array(z.string()),
  harvestWindows: z.string(),
  propagation: z.string(),
  citations: z.array(citationSchema),
});

export type ReferenceContent = z.infer<typeof referenceContentSchema>;
