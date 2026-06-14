/**
 * Extensible export system. Two registries — one for whole-collection exports (CSV data for
 * using elsewhere) and one for single-species "outreach" documents (monographs in various
 * formats). Adding a new format is just adding an entry to a registry; the UI renders
 * whatever is registered, so formats can grow over time without touching screens.
 */
export interface ExportArtifact {
  filename: string;
  mime: string;
  content: string | Blob;
}

export type ExportGroup = 'data' | 'document';

/** A whole-collection export (e.g. a CSV of every sighting). */
export interface CollectionExport {
  id: string;
  label: string;
  description?: string;
  group: ExportGroup;
  build: () => Promise<ExportArtifact>;
}

/** A single-species export (e.g. a monograph for outreach). */
export interface SpeciesExport {
  id: string;
  label: string;
  description?: string;
  group: ExportGroup;
  /** Some document formats (print) act directly rather than producing a file. */
  kind: 'file' | 'print';
  build: (speciesId: string) => Promise<ExportArtifact | null>;
}
