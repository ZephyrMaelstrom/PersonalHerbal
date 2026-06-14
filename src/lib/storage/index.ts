import type { DataStore } from './types';
import { createDexieStore } from './dexie-store';

export type {
  DataStore,
  Species,
  SpeciesInput,
  SpeciesNotes,
  SpeciesReference,
  SpeciesReferenceInput,
  UserVocabRow,
  Place,
  PlaceInput,
  Sighting,
  SightingInput,
  Harvest,
  HarvestInput,
  Preparation,
  PreparationInput,
  Photo,
  PhotoInput,
  JournalEntry,
  JournalEntryInput,
  BackupData,
} from './types';

/**
 * Single place that decides which backend to use. Today this is always IndexedDB
 * (Dexie). A SQLite-WASM/OPFS implementation can be selected here later behind a
 * capability check without any feature code changing.
 */
let store: DataStore | null = null;

export function getStore(): DataStore {
  if (!store) store = createDexieStore();
  return store;
}
