import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { CalendarDays, FlaskConical, Leaf, NotebookPen, Scissors } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { labelFor } from '@/lib/vocab';
import { useSpeciesList } from '@/features/species/hooks';
import { useAllHarvests, useAllPreparations, useAllSightings } from '@/features/dashboard/hooks';
import { useJournal } from '@/features/journal/hooks';

const today = () => new Date().toISOString().slice(0, 10);

interface AgendaItem {
  id: string;
  date: string;
  icon: typeof Leaf;
  label: string;
  speciesId?: string;
}

export function CalendarScreen() {
  const { data: species = [] } = useSpeciesList();
  const { data: preps = [] } = useAllPreparations();
  const { data: sightings = [] } = useAllSightings();
  const { data: harvests = [] } = useAllHarvests();
  const { data: journal = [] } = useJournal();

  const nameOf = useMemo(() => {
    const m = new Map(species.map((s) => [s.id, s.scientificName]));
    return (id?: string) => (id ? m.get(id) ?? 'Unknown' : '');
  }, [species]);

  const now = today();

  const pending = useMemo(
    () =>
      preps
        .filter((p) => p.readyAt && !['bottled', 'in_use', 'archived'].includes(p.state))
        .sort((a, b) => (a.readyAt! < b.readyAt! ? -1 : 1)),
    [preps],
  );

  const activity = useMemo<AgendaItem[]>(() => {
    const items: AgendaItem[] = [
      ...sightings.map((s) => ({
        id: `s-${s.id}`,
        date: (s.seenAt || '').slice(0, 10),
        icon: Leaf,
        label: `Sighting — ${nameOf(s.speciesId)}`,
        speciesId: s.speciesId,
      })),
      ...harvests.map((h) => ({
        id: `h-${h.id}`,
        date: (h.harvestedAt || '').slice(0, 10),
        icon: Scissors,
        label: `Harvest — ${nameOf(h.speciesId)}`,
        speciesId: h.speciesId,
      })),
      ...journal.map((j) => ({
        id: `j-${j.id}`,
        date: j.date,
        icon: NotebookPen,
        label: `Journal — ${j.title || 'entry'}`,
      })),
    ];
    return items.filter((i) => i.date).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30);
  }, [sightings, harvests, journal, nameOf]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Preparations</h2>
        {pending.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">Nothing maturing right now.</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pending.map((p) => {
              const ready = p.readyAt! <= now;
              return (
                <Link key={p.id} to="/species/$speciesId" params={{ speciesId: p.speciesId }}>
                  <Card className="transition-colors hover:border-primary/50">
                    <CardContent className="flex items-center gap-3 p-3">
                      <FlaskConical className="size-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {labelFor('preparation_method', p.method)} — <span className="italic">{nameOf(p.speciesId)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Ready {p.readyAt}</p>
                      </div>
                      <Badge variant={ready ? 'warning' : 'secondary'}>{ready ? 'Ready' : 'Maturing'}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent activity</h2>
        {activity.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <CalendarDays className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No dated activity yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activity.map((it) => {
              const Icon = it.icon;
              const inner = (
                <Card className={it.speciesId ? 'transition-colors hover:border-primary/50' : undefined}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <p className="min-w-0 flex-1 truncate text-sm">{it.label}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{it.date}</span>
                  </CardContent>
                </Card>
              );
              return it.speciesId ? (
                <Link key={it.id} to="/species/$speciesId" params={{ speciesId: it.speciesId }}>
                  {inner}
                </Link>
              ) : (
                <div key={it.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
