import { terms } from './types';

export const harvestSeason = terms([
  'early_spring', 'mid_spring', 'late_spring', 'early_summer', 'mid_summer', 'late_summer',
  'early_fall', 'mid_fall', 'late_fall', 'winter',
]);

export const moonPhase = terms(['new', 'waxing', 'full', 'waning']);

export const confidence = terms(['certain', 'probable', 'tentative', 'guess']);

export const storageForm = terms([
  'fresh', 'wilted', 'dried_whole', 'dried_cut', 'dried_powdered', 'frozen', 'fermented',
  'tinctured', 'oil_infused', 'honey_infused',
]);
