import type { VocabTerm } from './types';

/**
 * Units for harvested/prepared amounts. Labels are explicit (not auto-humanized) so
 * abbreviations like "mL" read correctly. User-extensible like every other vocab.
 */
export const amountUnit: VocabTerm[] = [
  { code: 'g', label: 'g (grams)' },
  { code: 'kg', label: 'kg' },
  { code: 'mg', label: 'mg' },
  { code: 'oz', label: 'oz' },
  { code: 'lb', label: 'lb' },
  { code: 'ml', label: 'mL' },
  { code: 'l', label: 'L' },
  { code: 'tsp', label: 'tsp' },
  { code: 'tbsp', label: 'tbsp' },
  { code: 'cup', label: 'cup' },
  { code: 'drop', label: 'drops' },
  { code: 'handful', label: 'handful' },
  { code: 'bunch', label: 'bunch' },
  { code: 'sprig', label: 'sprig' },
  { code: 'each', label: 'each' },
];
