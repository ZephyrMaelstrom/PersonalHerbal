import type { VocabId, VocabTerm } from './types';
import { plantPart } from './plant-part';
import { preparationMethod } from './preparation-method';
import { solvent } from './solvent';
import { action } from './action';
import { tissueAffinity } from './tissue-affinity';
import { energeticsTemperature, energeticsMoisture, energeticsTaste } from './energetics';
import { habitat } from './habitat';
import { sun, moisture, soilTexture, soilPh } from './site';
import { lifecycle } from './lifecycle';
import { nativeStatus, conservation, edibility } from './status';
import { safetyFlag } from './safety-flag';
import { harvestSeason, moonPhase, confidence, storageForm } from './misc';

export type { VocabId, VocabTerm } from './types';

/** Display metadata + seed terms for every controlled vocabulary. */
export const VOCAB_REGISTRY: Record<VocabId, { label: string; seed: VocabTerm[] }> = {
  plant_part: { label: 'Plant part', seed: plantPart },
  preparation_method: { label: 'Preparation method', seed: preparationMethod },
  solvent: { label: 'Solvent', seed: solvent },
  action: { label: 'Herbal action', seed: action },
  tissue_affinity: { label: 'Tissue affinity / system', seed: tissueAffinity },
  energetics_temperature: { label: 'Energetics — temperature', seed: energeticsTemperature },
  energetics_moisture: { label: 'Energetics — moisture', seed: energeticsMoisture },
  energetics_taste: { label: 'Energetics — taste', seed: energeticsTaste },
  habitat: { label: 'Habitat', seed: habitat },
  sun: { label: 'Sun', seed: sun },
  moisture: { label: 'Moisture', seed: moisture },
  soil_texture: { label: 'Soil texture', seed: soilTexture },
  soil_ph: { label: 'Soil pH', seed: soilPh },
  lifecycle: { label: 'Lifecycle', seed: lifecycle },
  native_status: { label: 'Native status', seed: nativeStatus },
  conservation: { label: 'Conservation', seed: conservation },
  edibility: { label: 'Edibility', seed: edibility },
  safety_flag: { label: 'Safety flag', seed: safetyFlag },
  harvest_season: { label: 'Harvest season', seed: harvestSeason },
  moon_phase: { label: 'Moon phase', seed: moonPhase },
  confidence: { label: 'Confidence', seed: confidence },
  storage_form: { label: 'Storage form', seed: storageForm },
};

export const ALL_VOCAB_IDS = Object.keys(VOCAB_REGISTRY) as VocabId[];

export function seedTerms(id: VocabId): VocabTerm[] {
  return VOCAB_REGISTRY[id].seed;
}

/** Merge seed terms with user-added terms, de-duplicating by code (seed wins on label). */
export function mergeVocab(id: VocabId, userTerms: VocabTerm[]): VocabTerm[] {
  const byCode = new Map<string, VocabTerm>();
  for (const t of seedTerms(id)) byCode.set(t.code, t);
  for (const t of userTerms) if (!byCode.has(t.code)) byCode.set(t.code, t);
  return [...byCode.values()];
}

/** Resolve a code to its display label using seed + (optional) user terms. */
export function labelFor(id: VocabId, code: string, userTerms: VocabTerm[] = []): string {
  const found = mergeVocab(id, userTerms).find((t) => t.code === code);
  return found?.label ?? code;
}
