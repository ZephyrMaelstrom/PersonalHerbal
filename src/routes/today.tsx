import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  CalendarDays,
  FlaskConical,
  Flame,
  Leaf,
  Map as MapIcon,
  MapPin,
  NotebookPen,
  Plus,
  Sparkles,
  Sunrise,
  Sunset,
  Trophy,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BuildStamp } from '@/components/layout/BuildStamp';
import { labelFor } from '@/lib/vocab';
import { moonPhase, sunTimes } from '@/lib/astro';
import { isInSeason } from '@/lib/season';
import { useSpeciesList } from '@/features/species/hooks';
import { SpeciesPhotoThumb } from '@/features/photos/SpeciesPhotoThumb';
import { useAllHarvests, useAllPreparations, useAllSightings } from '@/features/dashboard/hooks';
import { useJournal } from '@/features/journal/hooks';
import { useSaveSettings, useSettings } from '@/features/settings/hooks';
import { useProgressStats } from '@/features/progress/hooks';

const QUICK_LINKS = [
  { to: '/journal', label: 'Journal', icon: NotebookPen },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/places', label: 'Places', icon: MapPin },
  { to: '/map', label: 'Map', icon: MapIcon },
] as const;

const fmtTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export function TodayScreen() {
  const { data: species = [], isLoading } = useSpeciesList();
  const { data: preps = [] } = useAllPreparations();
  const { data: sightings = [] } = useAllSightings();
  const { data: harvests = [] } = useAllHarvests();
  const { data: journal = [] } = useJournal();
  const { data: settings } = useSettings();
  const saveSettings = useSaveSettings();
  const progress = useProgressStats();

  const now = new Date();
  const todayLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const isoToday = now.toISOString().slice(0, 10);
  const mmdd = isoToday.slice(5);
  const thisYear = now.getFullYear();

  const moon = moonPhase(now);
  const sun =
    settings?.homeLat != null && settings?.homeLng != null
      ? sunTimes(now, settings.homeLat, settings.homeLng)
      : null;

  const nameOf = useMemo(() => {
    const m = new Map(species.map((s) => [s.id, s.scientificName]));
    return (id: string) => m.get(id) ?? 'Unknown';
  }, [species]);

  const needsAttention = useMemo(
    () => preps.filter((p) => p.state === 'macerating' && p.readyAt && p.readyAt <= isoToday),
    [preps, isoToday],
  );

  const inSeason = useMemo(
    () => species.filter((s) => s.harvestSeasons.length > 0 && isInSeason(s.harvestSeasons, now)).slice(0, 6),
    [species, now],
  );

  const plantOfDay = useMemo(() => {
    if (species.length === 0) return undefined;
    const dayOfYear = Math.floor((now.getTime() - new Date(thisYear, 0, 0).getTime()) / 86_400_000);
    return species[dayOfYear % species.length];
  }, [species, now, thisYear]);

  const onThisDay = useMemo(() => {
    const items: Array<{ id: string; label: string; year: string; speciesId?: string }> = [];
    for (const s of sightings) {
      if (s.seenAt?.slice(5, 10) === mmdd && +s.seenAt.slice(0, 4) < thisYear)
        items.push({ id: `s-${s.id}`, label: `Saw ${nameOf(s.speciesId)}`, year: s.seenAt.slice(0, 4), speciesId: s.speciesId });
    }
    for (const h of harvests) {
      if (h.harvestedAt?.slice(5, 10) === mmdd && +h.harvestedAt.slice(0, 4) < thisYear)
        items.push({ id: `h-${h.id}`, label: `Harvested ${nameOf(h.speciesId)}`, year: h.harvestedAt.slice(0, 4), speciesId: h.speciesId });
    }
    for (const j of journal) {
      if (j.date?.slice(5, 10) === mmdd && +j.date.slice(0, 4) < thisYear)
        items.push({ id: `j-${j.id}`, label: `Journal: ${j.title || 'entry'}`, year: j.date.slice(0, 4) });
    }
    return items;
  }, [sightings, harvests, journal, mmdd, thisYear, nameOf]);

  const needsKey = species.length > 0 && settings && !settings.apiKey.trim();

  function setHomeLocation() {
    if (!('geolocation' in navigator) || !settings) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      saveSettings.mutate({
        ...settings,
        homeLat: +pos.coords.latitude.toFixed(4),
        homeLng: +pos.coords.longitude.toFixed(4),
      });
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">{todayLabel}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
      </div>

      {/* Sky: moon phase always; sunrise/sunset when a home location is set. */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <span className="text-3xl" aria-hidden>
            {moon.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{moon.name}</p>
            <p className="text-xs text-muted-foreground">{Math.round(moon.illumination * 100)}% illuminated</p>
          </div>
          {sun ? (
            <div className="text-right text-xs text-muted-foreground">
              <p className="flex items-center justify-end gap-1">
                <Sunrise className="size-3.5" /> {fmtTime(sun.sunrise)}
              </p>
              <p className="flex items-center justify-end gap-1">
                <Sunset className="size-3.5" /> {fmtTime(sun.sunset)}
              </p>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={setHomeLocation}>
              <MapPin /> Sun times
            </Button>
          )}
        </CardContent>
      </Card>

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

      {settings?.gamification && (
        <Link to="/progress">
          <Card className="transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-4 p-4">
              <Trophy className="size-5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Level {progress.level}</p>
                <p className="text-xs text-muted-foreground">{progress.points} pts</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className={progress.streak > 0 ? 'size-5 text-orange-400' : 'size-5 text-muted-foreground'} />
                <span className="text-lg font-semibold">{progress.streak}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-4 gap-2">
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

      <Link to="/companion">
        <Card className="transition-colors hover:border-primary/50">
          <CardContent className="flex items-center gap-3 p-3.5">
            <Sparkles className="size-5 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Consult the ArchDruid</p>
              <p className="text-xs text-muted-foreground">Your teacher in plants & medicine — ask anything</p>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Link to="/workbench">
        <Card className="transition-colors hover:border-primary/50">
          <CardContent className="flex items-center gap-3 p-3.5">
            <Wrench className="size-5 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Workbench</p>
              <p className="text-xs text-muted-foreground">Calculator, formulas & inventory</p>
            </div>
          </CardContent>
        </Card>
      </Link>

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

      {inSeason.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">In season now</h2>
          <div className="flex flex-wrap gap-1.5">
            {inSeason.map((s) => (
              <Link key={s.id} to="/species/$speciesId" params={{ speciesId: s.id }}>
                <Badge variant="secondary" className="italic">
                  {s.scientificName}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {plantOfDay && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Plant of the day</h2>
          <Link to="/species/$speciesId" params={{ speciesId: plantOfDay.id }}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-center gap-3 p-3.5">
                <SpeciesPhotoThumb photoId={plantOfDay.mainPhotoId} className="size-14" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium italic">{plantOfDay.scientificName}</p>
                  {plantOfDay.commonNames.length > 0 && (
                    <p className="truncate text-sm text-muted-foreground">{plantOfDay.commonNames.join(', ')}</p>
                  )}
                </div>
                <Sparkles className="size-4 shrink-0 text-primary" />
              </CardContent>
            </Card>
          </Link>
        </section>
      )}

      {onThisDay.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">On this day</h2>
          <div className="space-y-2">
            {onThisDay.map((it) => {
              const inner = (
                <Card className={it.speciesId ? 'transition-colors hover:border-primary/50' : undefined}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                    <p className="min-w-0 flex-1 truncate text-sm">{it.label}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{it.year}</span>
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
        </section>
      )}

      {species.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Leaf className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No species yet. Add your first plant or tap the camera to capture one.</p>
          </CardContent>
        </Card>
      )}

      <BuildStamp />
    </div>
  );
}
