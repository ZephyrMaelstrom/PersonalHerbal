import { getStore } from '@/lib/storage';
import { labelFor } from '@/lib/vocab';
import { toCsv, dateStamp } from './csv';
import type { CollectionExport, ExportArtifact } from './types';

const CSV_MIME = 'text/csv';

async function speciesNameMap(): Promise<(id: string) => string> {
  const species = await getStore().species.list();
  const m = new Map(species.map((s) => [s.id, s.scientificName]));
  return (id: string) => m.get(id) ?? '';
}

function file(name: string, content: string, mime = CSV_MIME): ExportArtifact {
  return { filename: `verdant-${name}-${dateStamp()}.csv`, mime, content };
}

const multi = (codes: string[], vocab: Parameters<typeof labelFor>[0]) =>
  codes.map((c) => labelFor(vocab, c)).join('; ');

const place = (r: { placeName?: string; lat?: number; lng?: number }) =>
  r.placeName ?? (r.lat != null ? `${r.lat}, ${r.lng}` : '');

/**
 * Informational CSV exports — human-readable (vocab codes rendered as labels) so the data is
 * usable in spreadsheets and other tools. More formats can be appended to this registry.
 */
export const COLLECTION_FORMATS: CollectionExport[] = [
  {
    id: 'species-csv',
    label: 'Species (CSV)',
    description: 'Every species with its attributes',
    group: 'data',
    async build() {
      const species = await getStore().species.list();
      const headers = [
        'Scientific name', 'Common names', 'Family', 'Lifecycle', 'Native status', 'Edibility',
        'Conservation', 'Habitats', 'Sun', 'Moisture', 'Soil texture', 'Soil pH', 'Actions',
        'Tissue affinities', 'Safety flags', 'Harvest seasons', 'Temperature', 'Moisture (energetic)',
        'Tastes', 'Added',
      ];
      const rows = species.map((s) => [
        s.scientificName, s.commonNames.join('; '), s.family ?? '',
        s.lifecycle ? labelFor('lifecycle', s.lifecycle) : '',
        s.nativeStatus ? labelFor('native_status', s.nativeStatus) : '',
        s.edibility ? labelFor('edibility', s.edibility) : '',
        s.conservation ? labelFor('conservation', s.conservation) : '',
        multi(s.habitats, 'habitat'), multi(s.sun, 'sun'), multi(s.moisture, 'moisture'),
        multi(s.soilTexture, 'soil_texture'), s.soilPh ? labelFor('soil_ph', s.soilPh) : '',
        multi(s.actions, 'action'), multi(s.tissueAffinities, 'tissue_affinity'),
        multi(s.safetyFlags, 'safety_flag'), multi(s.harvestSeasons, 'harvest_season'),
        s.energeticsTemperature ? labelFor('energetics_temperature', s.energeticsTemperature) : '',
        s.energeticsMoisture ? labelFor('energetics_moisture', s.energeticsMoisture) : '',
        multi(s.energeticsTastes, 'energetics_taste'), s.createdAt.slice(0, 10),
      ]);
      return file('species', toCsv(headers, rows));
    },
  },
  {
    id: 'sightings-csv',
    label: 'Sightings (CSV)',
    group: 'data',
    async build() {
      const [sightings, nameOf] = await Promise.all([getStore().sightings.listAll(), speciesNameMap()]);
      const headers = ['Species', 'Date', 'Confidence', 'Place', 'Lat', 'Lng', 'Notes'];
      const rows = sightings.map((s) => [
        nameOf(s.speciesId), s.seenAt?.slice(0, 10) ?? '',
        s.confidence ? labelFor('confidence', s.confidence) : '',
        place(s), s.lat ?? '', s.lng ?? '', s.notes,
      ]);
      return file('sightings', toCsv(headers, rows));
    },
  },
  {
    id: 'harvests-csv',
    label: 'Harvests (CSV)',
    group: 'data',
    async build() {
      const [harvests, nameOf] = await Promise.all([getStore().harvests.listAll(), speciesNameMap()]);
      const headers = ['Species', 'Date', 'Plant part', 'Amount', 'Unit', 'Condition', 'Intended use', 'Place', 'Notes'];
      const rows = harvests.map((h) => [
        nameOf(h.speciesId), h.harvestedAt?.slice(0, 10) ?? '',
        h.plantPart ? labelFor('plant_part', h.plantPart) : '', h.amount ?? '',
        h.amountUnit ? labelFor('amount_unit', h.amountUnit) : '',
        h.condition ? labelFor('storage_form', h.condition) : '',
        multi(h.intendedUse, 'preparation_method'), place(h), h.notes,
      ]);
      return file('harvests', toCsv(headers, rows));
    },
  },
  {
    id: 'preparations-csv',
    label: 'Preparations (CSV)',
    group: 'data',
    async build() {
      const [preps, nameOf] = await Promise.all([getStore().preparations.listAll(), speciesNameMap()]);
      const headers = ['Species', 'Method', 'Solvent', 'Ratio', 'Plant part', 'Amount', 'Unit', 'State', 'Started', 'Ready', 'Pressed', 'Bottled', 'Notes'];
      const rows = preps.map((p) => [
        nameOf(p.speciesId), labelFor('preparation_method', p.method),
        p.solvent ? labelFor('solvent', p.solvent) : '', p.ratio ?? '',
        p.plantPart ? labelFor('plant_part', p.plantPart) : '', p.amount ?? '',
        p.amountUnit ? labelFor('amount_unit', p.amountUnit) : '',
        labelFor('prep_state', p.state), p.startedAt?.slice(0, 10) ?? '',
        p.readyAt ?? '', p.pressedAt ?? '', p.bottledAt ?? '', p.notes,
      ]);
      return file('preparations', toCsv(headers, rows));
    },
  },
  {
    id: 'journal-csv',
    label: 'Journal (CSV)',
    group: 'data',
    async build() {
      const [journal, nameOf] = await Promise.all([getStore().journal.list(), speciesNameMap()]);
      const headers = ['Date', 'Title', 'Entry', 'Tagged species'];
      const rows = journal.map((j) => [j.date, j.title ?? '', j.body, j.speciesIds.map(nameOf).join('; ')]);
      return file('journal', toCsv(headers, rows));
    },
  },
];
