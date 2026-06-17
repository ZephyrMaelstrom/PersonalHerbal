import { getStore, type SpeciesInput } from '@/lib/storage';
import { EMPTY_SPECIES } from '@/features/species/SpeciesForm';
import { GEN1, GEN1_LESSON_BODY, GEN1_LESSON_TITLE, edibilityFor } from '@/lib/seed/gen1-data';

const SEED_FLAG = 'verdant.seeded.gen1';

export function gen1AlreadySeeded(): boolean {
  return localStorage.getItem(SEED_FLAG) === '1';
}

export function markGen1Seeded(): void {
  localStorage.setItem(SEED_FLAG, '1');
}

/**
 * Idempotent: adds any Gen 1 species not already present (matched by scientific name) and the
 * intro lesson if missing. Safe to run repeatedly. Returns how many species were added.
 */
export async function seedGen1(): Promise<{ added: number }> {
  const store = getStore();
  const existing = await store.species.list();
  const have = new Set(existing.map((s) => s.scientificName.toLowerCase()));

  let added = 0;
  for (const p of GEN1) {
    if (have.has(p.scientificName.toLowerCase())) continue;
    const input: SpeciesInput = {
      ...EMPTY_SPECIES,
      scientificName: p.scientificName,
      commonNames: p.commonNames,
      edibility: edibilityFor(p.flags),
      harvestSeasons: p.harvestSeasons,
    };
    await store.species.create(input);
    added++;
  }

  const journal = await store.journal.list();
  if (!journal.some((j) => j.title === GEN1_LESSON_TITLE)) {
    await store.journal.create({
      date: new Date().toISOString().slice(0, 10),
      title: GEN1_LESSON_TITLE,
      body: GEN1_LESSON_BODY,
      speciesIds: [],
    });
  }

  markGen1Seeded();
  return { added };
}
