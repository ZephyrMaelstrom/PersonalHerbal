import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { AlertTriangle, CalendarDays, FlaskConical, Leaf, MapPin, NotebookPen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BuildStamp } from '@/components/layout/BuildStamp';
import { labelFor } from '@/lib/vocab';
import { useSpeciesList } from '@/features/species/hooks';
import { SpeciesPhotoThumb } from '@/features/photos/SpeciesPhotoThumb';
import { useAllPreparations } from '@/features/dashboard/hooks';
import { useSettings } from '@/features/settings/hooks';

const QUICK_LINKS = [
  { to: '/journal', label: 'Journal', icon: NotebookPen },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/places', label: 'Places', icon: MapPin },
] as const;

export function TodayScreen() {
  const { data: species = [], isLoading } = useSpeciesList();
  const { data: preps = [] } = useAllPreparations();
  const { data: settings } = useSettings();

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const now = new Date().toISOString().slice(0, 10);
  const recent = species.slice(0, 5);

  const nameOf = useMemo(() => {
    const m = new Map(species.map((s) => [s.id, s.scientificName]));
    return (id: string) => m.get(id) ?? 'Unknown';
  }, [species]);

  const needsAttention = useMemo(
    () =>
      preps
        .filter((p) => p.state === 'macerating' && p.readyAt && p.readyAt <= now)
        .sort((a, b) => (a.readyAt! < b.readyAt! ? -1 : 1)),
    [preps, now],
  );

  const needsKey = species.length > 0 && settings && !settings.apiKey.trim();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
      </div>

      {needsKey && (
        <Link to="/settings">
          <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-400" />
            <p className="text-xs text-muted-foreground">
              Add your AI key in <span className="text-primary underline">Settings</span> to generate reference pages.
            </p>
          </div>
        </Link>
      )}

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-3xl font-semibold text-primary">{isLoading ? '—' : species.length}</p>
            <p className="text-sm text-muted-foreground">species in your codex</p>
          </div>
          <Button asChild>
            <Link to="/species/new">
              <Plus /> Add species
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex flex-col items-center gap-1.5 p-3 text-center">
                <Icon className="size-5 text-primary" />
                <span className="text-xs font-medium">{label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {needsAttention.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Needs attention</h2>
          <div className="space-y-2">
            {needsAttention.map((p) => (
              <Link key={p.id} to="/species/$speciesId" params={{ speciesId: p.speciesId }}>
                <Card className="border-yellow-500/30 transition-colors hover:border-primary/50">
                  <CardContent className="flex items-center gap-3 p-3">
                    <FlaskConical className="size-4 shrink-0 text-yellow-400" />
                    <p className="min-w-0 flex-1 truncate text-sm">
                      {labelFor('preparation_method', p.method)} — <span className="italic">{nameOf(p.speciesId)}</span>
                    </p>
                    <Badge variant="warning">Ready to press</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent</h2>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <Leaf className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No species yet. Add your first plant to begin.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recent.map((s) => (
              <Link key={s.id} to="/species/$speciesId" params={{ speciesId: s.id }}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="flex items-center gap-3 p-3.5">
                    <SpeciesPhotoThumb photoId={s.mainPhotoId} className="size-12" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium italic">{s.scientificName}</p>
                      {s.commonNames.length > 0 && (
                        <p className="truncate text-sm text-muted-foreground">{s.commonNames.join(', ')}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <BuildStamp />
    </div>
  );
}
