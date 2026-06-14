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

/** A named location the user revisits. Referenced by sightings and harvests. */
export interface Place {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  habitats: string[];
  createdAt: string;
}

/** A manual identification event: I saw this species here, on this date. No vision AI. */
export interface Sighting {
  id: string;
  speciesId: string;
  /** Optional linked photo (lives in the photos table). */
  photoId?: string;
  placeId?: string;
  placeName?: string;
  lat?: number;
  lng?: number;
  /** `confidence` vocab code. */
  confidence?: string;
  /** ISO date (YYYY-MM-DD or full ISO). */
  seenAt: string;
  notes: string;
  createdAt: string;
}

/** A harvest: what part, how much, where, in what condition, for what use. */
export interface Harvest {
  id: string;
  speciesId: string;
  /** `plant_part` vocab code. */
  plantPart?: string;
  amount?: number;
  /** `amount_unit` vocab code. */
  amountUnit?: string;
  /** `storage_form` vocab code (condition at harvest). */
  condition?: string;
  placeId?: string;
  placeName?: string;
  lat?: number;
  lng?: number;
  /** `preparation_method` vocab codes. */
  intendedUse: string[];
  harvestedAt: string;
  notes: string;
  createdAt: string;
}

/** A preparation moving through its lifecycle. `state` is a `prep_state` vocab code. */
export interface Preparation {
  id: string;
  speciesId: string;
  /** `preparation_method` vocab code. */
  method: string;
  /** `solvent` vocab code. */
  solvent?: string;
  /** Herb:menstruum ratio, e.g. "1:5". */
  ratio?: string;
  /** `plant_part` vocab code. */
  plantPart?: string;
  amount?: number;
  amountUnit?: string;
  /** `prep_state` vocab code. */
  state: string;
  startedAt: string;
  readyAt?: string;
  pressedAt?: string;
  bottledAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** A photo stored as a Blob in the local DB (no OPFS headers needed on Android). */
export interface Photo {
  id: string;
  speciesId: string;
  /** Set when the photo was captured during an "Add sighting" flow. */
  sightingId?: string;
  blob: Blob;
  mime: string;
  caption?: string;
  createdAt: string;
}

/** A user-added vocabulary term persisted so it reappears in future dropdowns. */
export interface UserVocabRow extends VocabTerm {
  id: string;
  vocabId: string;
  createdAt: string;
}

export type SpeciesInput = Omit<Species, 'id' | 'createdAt' | 'updatedAt'>;
/** A new reference version; the store assigns id/version/isCurrent/generatedAt. */
export type SpeciesReferenceInput = Pick<
  SpeciesReference,
  'speciesId' | 'model' | 'promptVersion' | 'contentHash' | 'content' | 'citationsPresent'
>;
export type PlaceInput = Omit<Place, 'id' | 'createdAt'>;
export type SightingInput = Omit<Sighting, 'id' | 'createdAt'>;
export type HarvestInput = Omit<Harvest, 'id' | 'createdAt'>;
export type PreparationInput = Omit<Preparation, 'id' | 'createdAt' | 'updatedAt'>;
export type PhotoInput = Omit<Photo, 'id' | 'createdAt'>;

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
    /** Append a new immutable version and make it the current one. */
    create(input: SpeciesReferenceInput): Promise<SpeciesReference>;
    /** Promote an existing version to be the current one. */
    setCurrent(speciesId: string, id: string): Promise<void>;
  };

  places: {
    list(): Promise<Place[]>;
    create(input: PlaceInput): Promise<Place>;
  };

  sightings: {
    list(speciesId: string): Promise<Sighting[]>;
    create(input: SightingInput): Promise<Sighting>;
    remove(id: string): Promise<void>;
  };

  harvests: {
    list(speciesId: string): Promise<Harvest[]>;
    create(input: HarvestInput): Promise<Harvest>;
    remove(id: string): Promise<void>;
  };

  preparations: {
    list(speciesId: string): Promise<Preparation[]>;
    get(id: string): Promise<Preparation | undefined>;
    create(input: PreparationInput): Promise<Preparation>;
    update(id: string, patch: Partial<PreparationInput>): Promise<void>;
    remove(id: string): Promise<void>;
  };

  photos: {
    listForSpecies(speciesId: string): Promise<Photo[]>;
    get(id: string): Promise<Photo | undefined>;
    add(input: PhotoInput): Promise<Photo>;
    remove(id: string): Promise<void>;
  };

  userVocab: {
    list(vocabId: string): Promise<VocabTerm[]>;
    add(vocabId: string, term: VocabTerm): Promise<void>;
  };
}
