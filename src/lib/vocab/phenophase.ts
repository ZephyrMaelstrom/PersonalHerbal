import type { VocabTerm } from './types';

/** Plant developmental stage observed in a sighting — feeds the personal bloom calendar. */
export const phenophase: VocabTerm[] = [
  { code: 'vegetative', label: 'Vegetative' },
  { code: 'budding', label: 'Budding' },
  { code: 'flowering', label: 'Flowering' },
  { code: 'fruiting', label: 'Fruiting' },
  { code: 'seeding', label: 'Seeding / seed set' },
  { code: 'senescent', label: 'Senescent' },
  { code: 'dormant', label: 'Dormant' },
];
