import { terms } from './types';

export const nativeStatus = terms([
  'native', 'naturalized', 'introduced', 'invasive', 'cultivated_only', 'escaped_cultivation',
  'unknown',
]);

export const conservation = terms([
  'common', 'locally_uncommon', 'uncommon', 'rare', 'threatened', 'endangered',
  'protected_do_not_harvest',
]);

export const edibility = terms([
  'edible_raw', 'edible_cooked', 'edible_prepared_only', 'conditionally_edible', 'famine_food',
  'non_edible', 'toxic', 'deadly',
]);
