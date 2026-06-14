import type { VocabTerm } from '@/lib/vocab';

/**
 * Core species record: identity + the user-entered classification captured in the
 * "new species" form. This is distinct from the two parallel layers:
 *  - `SpeciesReference` — the AI-generated, versioned wiki page (added in a later phase).
 *  - `SpeciesNotes`     — the user's private observation layer.
 */
export interface Species {
  id: string;
  scientificName: string;
  commonNames: string[];
  family?: string;
  lifecycle?: string;
  nativeStatus?: string;
  edibility?: string;
  conservation?: string;
  habitats: string[];
  sun: string[];
  moisture: string[];
  soilTexture: string[];
  soilPh?: string;
  actions: string[];
  tissueAffinities: string[];
  safetyFlags: string[];
  harvestSeasons: string[];
  energeticsTemperature?: string;
  energeticsMoisture?: string;
  energeticsTastes: string[];
  createdAt: string;
  updatedAt: string;
}

/** Personal, private layer. Never auto-populated by AI. */
export interface SpeciesNotes {
  speciesId: string;
  personalIdConfidence?: string;
  firstSeenAt?: string;
  freeNotes: string;
  tasteNotes: string;
  smellNotes: string;
  customTags: string[];
  updatedAt: string;
}

/** AI-generated reference page version. Immutable; new generations append a row. */
export interface SpeciesReference {
  id: string;
  speciesId: string;
  version: number;
  isCurrent: boolean;
  generatedAt: string;
  model: string;
  promptVersion: string;
  contentHash: string;
  /** Structured wiki content (validated with Zod at write time, later phase). */
  content: Record<string, unknown>;
  citationsPresent: boolean;
}

/** A user-added vocabulary term persisted so it reappears in future dropdowns. */
export interface UserVocabRow extends VocabTerm {
  id: string;
  vocabId: string;
  createdAt: string;
}

export type SpeciesInput = Omit<Species, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Storage abstraction. All feature code talks to this interface only, so the backend
 * (IndexedDB today; SQLite-WASM/OPFS or Capacitor Filesystem later) can be swapped
 * without touching features.
 */
export interface DataStore {
  readonly backend: 'indexeddb' | 'sqlite';
  ready(): Promise<void>;

  species: {
    list(): Promise<Species[]>;
    get(id: string): Promise<Species | undefined>;
    create(input: SpeciesInput): Promise<Species>;
    update(id: string, patch: Partial<SpeciesInput>): Promise<void>;
    remove(id: string): Promise<void>;
  };

  notes: {
    get(speciesId: string): Promise<SpeciesNotes | undefined>;
    upsert(notes: SpeciesNotes): Promise<void>;
  };

  reference: {
    listVersions(speciesId: string): Promise<SpeciesReference[]>;
    current(speciesId: string): Promise<SpeciesReference | undefined>;
  };

  userVocab: {
    list(vocabId: string): Promise<VocabTerm[]>;
    add(vocabId: string, term: VocabTerm): Promise<void>;
  };
}
