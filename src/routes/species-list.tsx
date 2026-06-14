import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Leaf, Plus, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/inputs/Field';
import { EnumSelect } from '@/components/inputs/EnumSelect';
import { MultiSelectChips } from '@/components/inputs/MultiSelectChips';
import { useSpeciesList } from '@/features/species/hooks';
import { SpeciesPhotoThumb } from '@/features/photos/SpeciesPhotoThumb';
import { labelFor } from '@/lib/vocab';

export function SpeciesListScreen() {
  const { data: species = [], isLoading } = useSpeciesList();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [edibility, setEdibility] = useState<string>();
  const [nativeStatus, setNativeStatus] = useState<string>();
  const [actions, setActions] = useState<string[]>([]);
  const [habitats, setHabitats] = useState<string[]>([]);
  const [safetyFlags, setSafetyFlags] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);

  const activeFilterCount =
    (edibility ? 1 : 0) +
    (nativeStatus ? 1 : 0) +
    actions.length +
    habitats.length +
    safetyFlags.length +
    seasons.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return species.filter((s) => {
      if (q) {
        const hay = [s.scientificName, ...s.commonNames, s.family ?? ''].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (edibility && s.edibility !== edibility) return false;
      if (nativeStatus && s.nativeStatus !== nativeStatus) return false;
      if (actions.length && !actions.every((a) => s.actions.includes(a))) return false;
      if (habitats.length && !habitats.every((h) => s.habitats.includes(h))) return false;
      if (safetyFlags.length && !safetyFlags.every((f) => s.safetyFlags.includes(f))) return false;
      if (seasons.length && !seasons.every((x) => s.harvestSeasons.includes(x))) return false;
      return true;
    });
  }, [species, search, edibility, nativeStatus, actions, habitats, safetyFlags, seasons]);

  function clearFilters() {
    setEdibility(undefined);
    setNativeStatus(undefined);
    setActions([]);
    setHabitats([]);
    setSafetyFlags([]);
    setSeasons([]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Species</h1>
        <Button asChild size="sm">
          <Link to="/species/new">
            <Plus /> Add
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or family…" />
        <Button
          type="button"
          variant={activeFilterCount ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal />
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Edibility">
                <EnumSelect vocab="edibility" value={edibility} onChange={setEdibility} placeholder="Any" />
              </Field>
              <Field label="Native status">
                <EnumSelect vocab="native_status" value={nativeStatus} onChange={setNativeStatus} placeholder="Any" />
              </Field>
              <Field label="Actions">
                <MultiSelectChips vocab="action" value={actions} onChange={setActions} placeholder="Filter by action" allowCreate={false} />
              </Field>
              <Field label="Habitat">
                <MultiSelectChips vocab="habitat" value={habitats} onChange={setHabitats} placeholder="Filter by habitat" allowCreate={false} />
              </Field>
              <Field label="Safety flags">
                <MultiSelectChips vocab="safety_flag" value={safetyFlags} onChange={setSafetyFlags} placeholder="Filter by flag" allowCreate={false} />
              </Field>
              <Field label="Harvest season">
                <MultiSelectChips vocab="harvest_season" value={seasons} onChange={setSeasons} placeholder="Filter by season" allowCreate={false} />
              </Field>
            </div>
            {activeFilterCount > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <X /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Leaf className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {species.length === 0 ? 'No species yet.' : 'No species match your filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <Link key={s.id} to="/species/$speciesId" params={{ speciesId: s.id }}>
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="flex gap-3 p-3.5">
                  <SpeciesPhotoThumb photoId={s.mainPhotoId} className="size-14" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <p className="font-medium italic">{s.scientificName}</p>
                      {s.commonNames.length > 0 && (
                        <p className="text-sm text-muted-foreground">{s.commonNames.join(', ')}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.edibility && <Badge>{labelFor('edibility', s.edibility)}</Badge>}
                      {s.nativeStatus && <Badge variant="secondary">{labelFor('native_status', s.nativeStatus)}</Badge>}
                      {s.safetyFlags.slice(0, 2).map((f) => (
                        <Badge key={f} variant="warning">
                          {labelFor('safety_flag', f)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
