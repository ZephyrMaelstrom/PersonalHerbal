/** A single controlled-vocabulary term. */
export interface VocabTerm {
  code: string;
  label: string;
  description?: string;
  aliases?: string[];
}

/** Identifier for a vocabulary list; also the `vocab_id` stored in user_vocab. */
export type VocabId =
  | 'plant_part'
  | 'preparation_method'
  | 'solvent'
  | 'action'
  | 'tissue_affinity'
  | 'energetics_temperature'
  | 'energetics_moisture'
  | 'energetics_taste'
  | 'habitat'
  | 'sun'
  | 'moisture'
  | 'soil_texture'
  | 'soil_ph'
  | 'lifecycle'
  | 'native_status'
  | 'conservation'
  | 'edibility'
  | 'safety_flag'
  | 'harvest_season'
  | 'moon_phase'
  | 'confidence'
  | 'storage_form';

/** Helper to turn a snake_case-ish code into a human label when none is given. */
export function humanizeCode(code: string): string {
  return code
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\(([^)]+)\)/g, (_, inner: string) => `(${inner})`);
}

/** Build a term list from codes, deriving labels automatically. */
export function terms(codes: string[]): VocabTerm[] {
  return codes.map((code) => ({ code, label: humanizeCode(code) }));
}
