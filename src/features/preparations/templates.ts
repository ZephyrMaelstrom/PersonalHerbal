/**
 * Per-method defaults that pre-fill the new-preparation form (solvent, herb:menstruum
 * ratio, and how many days until it's typically ready to press). All values are editable
 * after they're filled in — these are starting points, not rules. Keyed by
 * `preparation_method` vocab code.
 */
export interface PrepTemplate {
  solvent?: string;
  ratio?: string;
  daysToReady?: number;
}

export const PREP_TEMPLATES: Record<string, PrepTemplate> = {
  tincture: { solvent: 'ethanol_50', ratio: '1:5', daysToReady: 28 },
  double_extraction_tincture: { solvent: 'ethanol_70', ratio: '1:5', daysToReady: 42 },
  glycerite: { solvent: 'glycerin', ratio: '1:4', daysToReady: 28 },
  vinegar: { solvent: 'apple_cider_vinegar', ratio: '1:5', daysToReady: 14 },
  oxymel: { solvent: 'apple_cider_vinegar', ratio: '1:5', daysToReady: 21 },
  'oil_infusion (folk)': { solvent: 'olive_oil', ratio: '1:5', daysToReady: 28 },
  'oil_infusion (sous_vide)': { solvent: 'olive_oil', ratio: '1:5', daysToReady: 1 },
  honey_infusion: { solvent: 'raw_honey', ratio: '1:5', daysToReady: 28 },
  elixir: { solvent: 'ethanol_50', ratio: '1:5', daysToReady: 28 },
  cold_infusion: { solvent: 'water', ratio: '1:30', daysToReady: 1 },
  syrup: { solvent: 'water', ratio: '1:1', daysToReady: 1 },
  ferment: { solvent: 'water', ratio: '1:1', daysToReady: 14 },
};

export function templateFor(method?: string): PrepTemplate {
  return (method && PREP_TEMPLATES[method]) || {};
}

/** Add N days to a YYYY-MM-DD date string, returning the same format. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
