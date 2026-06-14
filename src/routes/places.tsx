import { useMemo, useState } from 'react';
import { MapPin, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/inputs/Field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import type { Place } from '@/lib/storage';
import { useCreatePlace, useDeletePlace, usePlaces, useUpdatePlace } from '@/features/places/hooks';
import { useAllHarvests, useAllSightings } from '@/features/dashboard/hooks';

export function PlacesScreen() {
  const { data: places = [], isLoading } = usePlaces();
  const { data: sightings = [] } = useAllSightings();
  const { data: harvests = [] } = useAllHarvests();
  const create = useCreatePlace();
  const update = useUpdatePlace();
  const del = useDeletePlace();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Place | null>(null);
  const [name, setName] = useState('');

  const counts = useMemo(() => {
    const m = new Map<string, { s: number; h: number }>();
    for (const s of sightings) if (s.placeId) {
      const c = m.get(s.placeId) ?? { s: 0, h: 0 };
      c.s++;
      m.set(s.placeId, c);
    }
    for (const h of harvests) if (h.placeId) {
      const c = m.get(h.placeId) ?? { s: 0, h: 0 };
      c.h++;
      m.set(h.placeId, c);
    }
    return m;
  }, [sightings, harvests]);

  function openEdit(p: Place) {
    setEditing(p);
    setName(p.name);
  }

  async function saveEdit() {
    if (editing && name.trim()) await update.mutateAsync({ id: editing.id, patch: { name: name.trim() } });
    setEditing(null);
  }

  function remove(p: Place) {
    del.mutate(p.id);
    toast({
      message: 'Place deleted',
      actionLabel: 'Undo',
      onAction: () => create.mutate({ name: p.name, lat: p.lat, lng: p.lng, habitats: p.habitats }),
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Places</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : places.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <MapPin className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No saved places yet. They're created when you log a sighting or harvest at a named location.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {places.map((p) => {
            const c = counts.get(p.id) ?? { s: 0, h: 0 };
            return (
              <Card key={p.id}>
                <CardContent className="flex items-center gap-3 p-3.5">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.lat != null ? `${p.lat}, ${p.lng} · ` : ''}
                      {c.s} sighting{c.s === 1 ? '' : 's'} · {c.h} harvest{c.h === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive-foreground/70" onClick={() => remove(p)}>
                    <Trash2 />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename place</DialogTitle>
          </DialogHeader>
          <Field label="Name" htmlFor="placename">
            <Input id="placename" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
