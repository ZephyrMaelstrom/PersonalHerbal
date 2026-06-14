import { useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/toast';
import { ACHIEVEMENTS, computeStats, unlockedCodes, type ProgressStats } from '@/lib/achievements';
import { useSpeciesList } from '@/features/species/hooks';
import { useAllHarvests, useAllPreparations, useAllSightings } from '@/features/dashboard/hooks';
import { useJournal } from '@/features/journal/hooks';

const SEEN_KEY = 'verdant.unlocked';
const INIT_KEY = 'verdant.unlocked.init';

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

/** Combined progress stats derived from all local data. */
export function useProgressStats(): ProgressStats {
  const { data: species = [] } = useSpeciesList();
  const { data: sightings = [] } = useAllSightings();
  const { data: harvests = [] } = useAllHarvests();
  const { data: preparations = [] } = useAllPreparations();
  const { data: journal = [] } = useJournal();
  return useMemo(
    () => computeStats({ species, sightings, harvests, preparations, journal }),
    [species, sightings, harvests, preparations, journal],
  );
}

/**
 * Watches achievement unlocks and toasts newly earned ones (once). Safe to mount globally;
 * a no-op when gamification is disabled. Initialization waits until all data has loaded and
 * seeds the "seen" set silently, so enabling it never floods toasts with past progress.
 */
export function useAchievementsWatcher(enabled: boolean) {
  const sp = useSpeciesList();
  const si = useAllSightings();
  const ha = useAllHarvests();
  const pr = useAllPreparations();
  const jo = useJournal();
  const { toast } = useToast();

  const ready = sp.isSuccess && si.isSuccess && ha.isSuccess && pr.isSuccess && jo.isSuccess;

  useEffect(() => {
    if (!enabled || !ready) return;
    const stats = computeStats({
      species: sp.data!,
      sightings: si.data!,
      harvests: ha.data!,
      preparations: pr.data!,
      journal: jo.data!,
    });
    const unlocked = unlockedCodes(stats);

    if (localStorage.getItem(INIT_KEY) !== '1') {
      localStorage.setItem(SEEN_KEY, JSON.stringify(unlocked));
      localStorage.setItem(INIT_KEY, '1');
      return;
    }

    const seen = loadSeen();
    const fresh = unlocked.filter((c) => !seen.has(c));
    if (fresh.length === 0) return;
    for (const c of fresh) seen.add(c);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
    for (const c of fresh) {
      const a = ACHIEVEMENTS.find((x) => x.code === c);
      if (a) toast({ message: `${a.emoji} Achievement unlocked — ${a.title}` });
    }
  }, [enabled, ready, sp.data, si.data, ha.data, pr.data, jo.data, toast]);
}
