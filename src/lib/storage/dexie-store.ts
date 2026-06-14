import Dexie, { type Table } from 'dexie';
import type { VocabTerm } from '@/lib/vocab';
import { uid } from '@/lib/utils';
import type {
  DataStore,
  Species,
  SpeciesInput,
  SpeciesNotes,
  SpeciesReference,
  UserVocabRow,
} from './types';

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

  constructor() {
    super('verdant-codex');
    this.version(1).stores({
      species: 'id, scientificName, family, updatedAt',
      notes: 'speciesId',
      reference: 'id, speciesId, version, isCurrent',
      userVocab: 'id, vocabId, [vocabId+code]',
    });
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
        await db.transaction('rw', db.species, db.notes, db.reference, async () => {
          await db.species.delete(id);
          await db.notes.delete(id);
          await db.reference.where('speciesId').equals(id).delete();
        });
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
  };
}
