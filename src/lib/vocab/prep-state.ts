import type { VocabTerm } from './types';

/**
 * Preparation lifecycle states. Order matters: the Preparations UI advances through this
 * list and stamps the matching date field on the record as it goes.
 */
export const prepState: VocabTerm[] = [
  { code: 'macerating', label: 'Macerating' },
  { code: 'ready', label: 'Ready to press' },
  { code: 'pressed', label: 'Pressed' },
  { code: 'bottled', label: 'Bottled' },
  { code: 'in_use', label: 'In use' },
  { code: 'archived', label: 'Archived' },
];

/** Canonical ordering used by the lifecycle controls. */
export const PREP_STATE_ORDER = prepState.map((t) => t.code);
