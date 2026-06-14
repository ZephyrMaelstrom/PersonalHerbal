/**
 * Map the current date to `harvest_season` vocab codes (Northern Hemisphere, approximate),
 * so the Today screen can surface which of your species are in season now.
 */
const MONTH_SEASONS: string[][] = [
  ['winter'], // Jan
  ['winter', 'early_spring'], // Feb
  ['early_spring', 'mid_spring'], // Mar
  ['mid_spring', 'late_spring'], // Apr
  ['late_spring', 'early_summer'], // May
  ['early_summer', 'mid_summer'], // Jun
  ['mid_summer', 'late_summer'], // Jul
  ['late_summer', 'early_fall'], // Aug
  ['early_fall', 'mid_fall'], // Sep
  ['mid_fall', 'late_fall'], // Oct
  ['late_fall', 'winter'], // Nov
  ['winter'], // Dec
];

export function currentSeasonCodes(date = new Date()): string[] {
  return MONTH_SEASONS[date.getMonth()];
}

export function isInSeason(harvestSeasons: string[], date = new Date()): boolean {
  const now = currentSeasonCodes(date);
  return harvestSeasons.some((s) => now.includes(s));
}
