import type { Harvest, JournalEntry, Preparation, Sighting, Species } from '@/lib/storage';

export interface ProgressInput {
  species: Species[];
  sightings: Sighting[];
  harvests: Harvest[];
  preparations: Preparation[];
  journal: JournalEntry[];
}

export interface ProgressStats {
  speciesCount: number;
  sightingCount: number;
  harvestCount: number;
  prepCount: number;
  journalCount: number;
  pressedCount: number;
  distinctPlaces: number;
  speciesWithPhoto: number;
  streak: number;
  points: number;
  level: number;
  /** Points into the current level and what the next level needs. */
  levelProgress: number;
  levelSpan: number;
}

const PRESSED_STATES = new Set(['pressed', 'bottled', 'in_use', 'archived']);
const POINTS_PER_LEVEL = 100;

/** Longest run of consecutive days ending today (or yesterday) that have any activity. */
function computeStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0;
  const day = 86_400_000;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const todayStr = start.toISOString().slice(0, 10);
  const yesterdayStr = new Date(start.getTime() - day).toISOString().slice(0, 10);
  if (!dates.has(todayStr) && !dates.has(yesterdayStr)) return 0;

  let streak = 0;
  let cursor = dates.has(todayStr) ? start.getTime() : start.getTime() - day;
  while (dates.has(new Date(cursor).toISOString().slice(0, 10))) {
    streak++;
    cursor -= day;
  }
  return streak;
}

export function computeStats(input: ProgressInput): ProgressStats {
  const { species, sightings, harvests, preparations, journal } = input;

  const activityDays = new Set<string>();
  for (const s of sightings) if (s.seenAt) activityDays.add(s.seenAt.slice(0, 10));
  for (const h of harvests) if (h.harvestedAt) activityDays.add(h.harvestedAt.slice(0, 10));
  for (const j of journal) if (j.date) activityDays.add(j.date.slice(0, 10));
  for (const p of preparations) if (p.startedAt) activityDays.add(p.startedAt.slice(0, 10));

  const places = new Set<string>();
  for (const s of sightings) if (s.placeId) places.add(s.placeId);
  for (const h of harvests) if (h.placeId) places.add(h.placeId);

  const pressedCount = preparations.filter((p) => PRESSED_STATES.has(p.state)).length;
  const speciesWithPhoto = species.filter((s) => s.mainPhotoId).length;

  const points =
    species.length * 5 +
    sightings.length * 2 +
    harvests.length * 3 +
    preparations.length * 5 +
    journal.length * 2 +
    pressedCount * 5;
  const level = Math.floor(points / POINTS_PER_LEVEL) + 1;

  return {
    speciesCount: species.length,
    sightingCount: sightings.length,
    harvestCount: harvests.length,
    prepCount: preparations.length,
    journalCount: journal.length,
    pressedCount,
    distinctPlaces: places.size,
    speciesWithPhoto,
    streak: computeStreak(activityDays),
    points,
    level,
    levelProgress: points % POINTS_PER_LEVEL,
    levelSpan: POINTS_PER_LEVEL,
  };
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  emoji: string;
  done: (s: ProgressStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { code: 'first_species', title: 'First entry', description: 'Add your first species', emoji: '🌱', done: (s) => s.speciesCount >= 1 },
  { code: 'ten_species', title: 'Budding herbalist', description: 'Catalog 10 species', emoji: '🌿', done: (s) => s.speciesCount >= 10 },
  { code: 'twentyfive_species', title: 'Green keeper', description: 'Catalog 25 species', emoji: '🌳', done: (s) => s.speciesCount >= 25 },
  { code: 'first_sighting', title: 'First sighting', description: 'Log a sighting', emoji: '👁️', done: (s) => s.sightingCount >= 1 },
  { code: 'fifty_sightings', title: 'Keen eye', description: 'Log 50 sightings', emoji: '🔭', done: (s) => s.sightingCount >= 50 },
  { code: 'first_harvest', title: 'First harvest', description: 'Record a harvest', emoji: '🧺', done: (s) => s.harvestCount >= 1 },
  { code: 'first_prep', title: 'Apothecary', description: 'Start a preparation', emoji: '⚗️', done: (s) => s.prepCount >= 1 },
  { code: 'first_pressed', title: 'Patience rewarded', description: 'Press a preparation', emoji: '🫗', done: (s) => s.pressedCount >= 1 },
  { code: 'five_preps', title: 'Stocked shelf', description: 'Make 5 preparations', emoji: '🏺', done: (s) => s.prepCount >= 5 },
  { code: 'first_journal', title: 'Field notes', description: 'Write a journal entry', emoji: '📓', done: (s) => s.journalCount >= 1 },
  { code: 'three_places', title: 'Wanderer', description: 'Find plants in 3 places', emoji: '🗺️', done: (s) => s.distinctPlaces >= 3 },
  { code: 'five_photos', title: 'Illustrator', description: 'Give 5 species a photo', emoji: '📷', done: (s) => s.speciesWithPhoto >= 5 },
  { code: 'streak_7', title: 'Daily ritual', description: '7-day activity streak', emoji: '🔥', done: (s) => s.streak >= 7 },
];

export function unlockedCodes(stats: ProgressStats): string[] {
  return ACHIEVEMENTS.filter((a) => a.done(stats)).map((a) => a.code);
}
