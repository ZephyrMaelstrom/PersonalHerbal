import { terms } from './types';

export const sun = terms(['full_sun', 'part_sun', 'part_shade', 'full_shade', 'dappled']);

export const moisture = terms(['xeric', 'mesic_dry', 'mesic', 'mesic_wet', 'hydric']);

export const soilTexture = terms([
  'sand', 'loamy_sand', 'sandy_loam', 'loam', 'silt_loam', 'clay_loam', 'clay', 'peat', 'muck',
  'rocky',
]);

export const soilPh = terms([
  'very_acidic', 'acidic', 'slightly_acidic', 'neutral', 'slightly_alkaline', 'alkaline',
]);
