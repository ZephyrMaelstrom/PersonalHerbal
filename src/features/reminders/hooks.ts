import { useEffect } from 'react';
import { labelFor } from '@/lib/vocab';
import { useAllPreparations } from '@/features/dashboard/hooks';
import { useSpeciesList } from '@/features/species/hooks';

const NOTIFIED_KEY = 'verdant.notified';

/**
 * Local reminders: when enabled and permission is granted, notify (once) about preparations
 * that are ready to press. Fires on app open — PWAs can't reliably deliver true background
 * notifications, so this surfaces due items whenever the app is launched, deduped per id.
 */
export function useReminders(enabled: boolean) {
  const { data: preps = [] } = useAllPreparations();
  const { data: species = [] } = useSpeciesList();

  useEffect(() => {
    if (!enabled) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const today = new Date().toISOString().slice(0, 10);
    const due = preps.filter((p) => p.state === 'macerating' && p.readyAt && p.readyAt <= today);
    if (due.length === 0) return;

    let notified: Set<string>;
    try {
      notified = new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '[]') as string[]);
    } catch {
      notified = new Set();
    }
    const nameOf = new Map(species.map((s) => [s.id, s.scientificName]));
    const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`;
    let changed = false;

    for (const p of due) {
      if (notified.has(p.id)) continue;
      notified.add(p.id);
      changed = true;
      try {
        new Notification('Ready to press', {
          body: `${labelFor('preparation_method', p.method)} — ${nameOf.get(p.speciesId) ?? ''}`,
          icon,
          tag: `prep-${p.id}`,
        });
      } catch {
        // ignore notification failures
      }
    }
    if (changed) localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified]));
  }, [enabled, preps, species]);
}
