import Dexie, { type Table } from 'dexie';
import type { VocabTerm } from '@/lib/vocab';
import { uid } from '@/lib/utils';
import type {
  BackupData,
  BackupPhoto,
  DataStore,
  Harvest,
  HarvestInput,
  JournalEntry,
  JournalEntryInput,
  Photo,
  PhotoInput,
  Place,
  PlaceInput,
  Preparation,
  PreparationInput,
  Sighting,
  SightingInput,
  Species,
  SpeciesInput,
  SpeciesNotes,
  SpeciesReference,
  SpeciesReferenceInput,
  UserVocabRow,
} from './types';

const BACKUP_VERSION = 1;

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function base64ToBlob(b64: string, mime: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * IndexedDB-backed store (via Dexie). Chosen as the v1 backend because it works on
 * every mobile browser with zero special headers or workers — ideal for the
 * GitHub-Pages-on-Android test loop. Schema versions here mirror what a future SQLite
 * migration runner would track.
 */
class VerdantDb extends Dexie {
  species!: Table<Species, string>;
  notes!: Table<SpeciesNotes, string>;
  reference!: Table<SpeciesReference, string>;
  userVocab!: Table<UserVocabRow, string>;
  places!: Table<Place, string>;
  sightings!: Table<Sighting, string>;
  harvests!: Table<Harvest, string>;
  preparations!: Table<Preparation, string>;
  photos!: Table<Photo, string>;
  journal!: Table<JournalEntry, string>;

  constructor() {
    super('verdant-codex');
    this.version(1).stores({
      species: 'id, scientificName, family, updatedAt',
      notes: 'speciesId',
      reference: 'id, speciesId, version, isCurrent',
      userVocab: 'id, vocabId, [vocabId+code]',
    });
    // v2 adds the observation/preparation/photo layers. Existing v1 tables and on-device
    // data carry over untouched; Dexie only applies the additive table definitions.
    this.version(2).stores({
      places: 'id, name',
      sightings: 'id, speciesId, seenAt',
      harvests: 'id, speciesId, harvestedAt',
      preparations: 'id, speciesId, state, startedAt',
      photos: 'id, speciesId, sightingId',
    });
    // v3 adds the journal (additive).
    this.version(3).stores({
      journal: 'id, date',
    });
  }

  get allTables(): Table[] {
    return [
      this.species,
      this.notes,
      this.reference,
      this.userVocab,
      this.places,
      this.sightings,
      this.harvests,
      this.preparations,
      this.photos,
      this.journal,
    ];
  }
}

export function createDexieStore(): DataStore {
  const db = new VerdantDb();

  return {
    backend: 'indexeddb',

    async ready() {
      await db.open();
    },

    species: {
      list: () => db.species.orderBy('updatedAt').reverse().toArray(),
      get: (id) => db.species.get(id),
      async create(input: SpeciesInput) {
        const now = new Date().toISOString();
        const record: Species = { ...input, id: uid(), createdAt: now, updatedAt: now };
        await db.transaction('rw', db.species, db.notes, async () => {
          await db.species.add(record);
          await db.notes.put({
            speciesId: record.id,
            freeNotes: '',
            tasteNotes: '',
            smellNotes: '',
            customTags: [],
            updatedAt: now,
          });
        });
        return record;
      },
      async update(id, patch) {
        await db.species.update(id, { ...patch, updatedAt: new Date().toISOString() });
      },
      async remove(id) {
        await db.transaction(
          'rw',
          [db.species, db.notes, db.reference, db.sightings, db.harvests, db.preparations, db.photos],
          async () => {
            await db.species.delete(id);
            await db.notes.delete(id);
            await db.reference.where('speciesId').equals(id).delete();
            await db.sightings.where('speciesId').equals(id).delete();
            await db.harvests.where('speciesId').equals(id).delete();
            await db.preparations.where('speciesId').equals(id).delete();
            await db.photos.where('speciesId').equals(id).delete();
          },
        );
      },
    },

    notes: {
      get: (speciesId) => db.notes.get(speciesId),
      async upsert(notes: SpeciesNotes) {
        await db.notes.put({ ...notes, updatedAt: new Date().toISOString() });
      },
    },

    reference: {
      listVersions: (speciesId) =>
        db.reference.where('speciesId').equals(speciesId).reverse().sortBy('version'),
      async current(speciesId) {
        const versions = await db.reference.where('speciesId').equals(speciesId).toArray();
        return versions.find((v) => v.isCurrent);
      },
      async create(input: SpeciesReferenceInput) {
        const existing = await db.reference.where('speciesId').equals(input.speciesId).toArray();
        const version = existing.reduce((max, v) => Math.max(max, v.version), 0) + 1;
        const record: SpeciesReference = {
          ...input,
          id: uid(),
          version,
          isCurrent: true,
          generatedAt: new Date().toISOString(),
        };
        await db.transaction('rw', db.reference, async () => {
          for (const v of existing) {
            if (v.isCurrent) await db.reference.update(v.id, { isCurrent: false });
          }
          await db.reference.add(record);
        });
        return record;
      },
      async setCurrent(speciesId, id) {
        const versions = await db.reference.where('speciesId').equals(speciesId).toArray();
        await db.transaction('rw', db.reference, async () => {
          for (const v of versions) {
            await db.reference.update(v.id, { isCurrent: v.id === id });
          }
        });
      },
    },

    places: {
      list: () => db.places.orderBy('name').toArray(),
      async create(input: PlaceInput) {
        const record: Place = { ...input, id: uid(), createdAt: new Date().toISOString() };
        await db.places.add(record);
        return record;
      },
      async update(id, patch) {
        await db.places.update(id, patch);
      },
      remove: (id) => db.places.delete(id),
    },

    sightings: {
      list: (speciesId) =>
        db.sightings.where('speciesId').equals(speciesId).reverse().sortBy('seenAt'),
      listAll: () => db.sightings.reverse().sortBy('seenAt'),
      async create(input: SightingInput) {
        const record: Sighting = { ...input, id: uid(), createdAt: new Date().toISOString() };
        await db.sightings.add(record);
        return record;
      },
      async remove(id) {
        await db.transaction('rw', db.sightings, db.photos, async () => {
          const sighting = await db.sightings.get(id);
          await db.sightings.delete(id);
          // Drop the photo captured for this sighting, if any.
          if (sighting?.photoId) await db.photos.delete(sighting.photoId);
        });
      },
    },

    harvests: {
      list: (speciesId) =>
        db.harvests.where('speciesId').equals(speciesId).reverse().sortBy('harvestedAt'),
      listAll: () => db.harvests.reverse().sortBy('harvestedAt'),
      async create(input: HarvestInput) {
        const record: Harvest = { ...input, id: uid(), createdAt: new Date().toISOString() };
        await db.harvests.add(record);
        return record;
      },
      remove: (id) => db.harvests.delete(id),
    },

    preparations: {
      list: (speciesId) =>
        db.preparations.where('speciesId').equals(speciesId).reverse().sortBy('startedAt'),
      listAll: () => db.preparations.reverse().sortBy('startedAt'),
      get: (id) => db.preparations.get(id),
      async create(input: PreparationInput) {
        const now = new Date().toISOString();
        const record: Preparation = { ...input, id: uid(), createdAt: now, updatedAt: now };
        await db.preparations.add(record);
        return record;
      },
      async update(id, patch) {
        await db.preparations.update(id, { ...patch, updatedAt: new Date().toISOString() });
      },
      remove: (id) => db.preparations.delete(id),
    },

    photos: {
      listForSpecies: (speciesId) =>
        db.photos.where('speciesId').equals(speciesId).reverse().sortBy('createdAt'),
      get: (id) => db.photos.get(id),
      async add(input: PhotoInput) {
        const record: Photo = { ...input, id: uid(), createdAt: new Date().toISOString() };
        await db.photos.add(record);
        return record;
      },
      remove: (id) => db.photos.delete(id),
    },

    userVocab: {
      async list(vocabId): Promise<VocabTerm[]> {
        const rows = await db.userVocab.where('vocabId').equals(vocabId).toArray();
        return rows.map(({ code, label, description, aliases }) => ({
          code,
          label,
          description,
          aliases,
        }));
      },
      async add(vocabId, term) {
        const existing = await db.userVocab
          .where('[vocabId+code]')
          .equals([vocabId, term.code])
          .first();
        if (existing) return;
        await db.userVocab.add({
          ...term,
          id: uid(),
          vocabId,
          createdAt: new Date().toISOString(),
        });
      },
    },

    journal: {
      list: () => db.journal.orderBy('date').reverse().toArray(),
      get: (id) => db.journal.get(id),
      async create(input: JournalEntryInput) {
        const now = new Date().toISOString();
        const record: JournalEntry = { ...input, id: uid(), createdAt: now, updatedAt: now };
        await db.journal.add(record);
        return record;
      },
      async update(id, patch) {
        await db.journal.update(id, { ...patch, updatedAt: new Date().toISOString() });
      },
      remove: (id) => db.journal.delete(id),
    },

    backup: {
      async exportAll(): Promise<BackupData> {
        const [species, notes, reference, userVocab, places, sightings, harvests, preparations, journal, photoRows] =
          await Promise.all([
            db.species.toArray(),
            db.notes.toArray(),
            db.reference.toArray(),
            db.userVocab.toArray(),
            db.places.toArray(),
            db.sightings.toArray(),
            db.harvests.toArray(),
            db.preparations.toArray(),
            db.journal.toArray(),
            db.photos.toArray(),
          ]);
        const photos: BackupPhoto[] = await Promise.all(
          photoRows.map(async ({ blob, ...rest }) => ({ ...rest, dataBase64: await blobToBase64(blob) })),
        );
        return {
          app: 'verdant-codex',
          version: BACKUP_VERSION,
          exportedAt: new Date().toISOString(),
          species,
          notes,
          reference,
          userVocab,
          places,
          sightings,
          harvests,
          preparations,
          journal,
          photos,
        };
      },
      async importAll(data: BackupData) {
        if (data.app !== 'verdant-codex') throw new Error('Not a Verdant Codex backup file.');
        const photos: Photo[] = data.photos.map(({ dataBase64, ...rest }) => ({
          ...rest,
          blob: base64ToBlob(dataBase64, rest.mime),
        }));
        await db.transaction('rw', db.allTables, async () => {
          await Promise.all(db.allTables.map((t) => t.clear()));
          await Promise.all([
            db.species.bulkAdd(data.species),
            db.notes.bulkAdd(data.notes),
            db.reference.bulkAdd(data.reference),
            db.userVocab.bulkAdd(data.userVocab),
            db.places.bulkAdd(data.places),
            db.sightings.bulkAdd(data.sightings),
            db.harvests.bulkAdd(data.harvests),
            db.preparations.bulkAdd(data.preparations),
            db.journal.bulkAdd(data.journal ?? []),
            db.photos.bulkAdd(photos),
          ]);
        });
      },
    },
  };
}
