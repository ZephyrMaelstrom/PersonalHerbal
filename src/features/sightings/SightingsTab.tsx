import { useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/inputs/Field';
import { EnumSelect } from '@/components/inputs/EnumSelect';
import { useToast } from '@/components/ui/toast';
import { PhotoCapture } from '@/features/photos/PhotoCapture';
import { PhotoImg } from '@/features/photos/PhotoImg';
import { makeThumb, processImage } from '@/features/photos/image';
import { readPhotoMeta } from '@/features/photos/exif';
import { useAddPhoto, useSpeciesPhotos } from '@/features/photos/hooks';
import { LocationPicker, type LocationValue } from '@/features/places/LocationPicker';
import { labelFor } from '@/lib/vocab';
import { useCreateSighting, useDeleteSighting, useSightings } from './hooks';

const today = () => new Date().toISOString().slice(0, 10);

export function SightingsTab({ speciesId }: { speciesId: string }) {
  const { data: sightings = [], isLoading } = useSightings(speciesId);
  const { data: photos = [] } = useSpeciesPhotos(speciesId);
  const create = useCreateSighting(speciesId);
  const del = useDeleteSighting(speciesId);
  const addPhoto = useAddPhoto(speciesId);
  const { toast } = useToast();

  function removeSighting(s: (typeof sightings)[number]) {
    del.mutate(s.id);
    toast({
      message: 'Sighting deleted',
      actionLabel: 'Undo',
      onAction: () =>
        create.mutate({
          speciesId,
          placeId: s.placeId,
          placeName: s.placeName,
          lat: s.lat,
          lng: s.lng,
          confidence: s.confidence,
          phenophase: s.phenophase,
          seenAt: s.seenAt,
          notes: s.notes,
        }),
    });
  }

  const photoById = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);

  const [adding, setAdding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [confidence, setConfidence] = useState<string>();
  const [phenophase, setPhenophase] = useState<string>();
  const [location, setLocation] = useState<LocationValue>({});
  const [seenAt, setSeenAt] = useState(today());
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  function reset() {
    setFile(null);
    setConfidence(undefined);
    setPhenophase(undefined);
    setLocation({});
    setSeenAt(today());
    setNotes('');
    setAdding(false);
  }

  async function submit() {
    setBusy(true);
    try {
      let photoId: string | undefined;
      if (file) {
        const { blob, mime } = await processImage(file);
        const thumb = await makeThumb(blob);
        const photo = await addPhoto.mutateAsync({ speciesId, blob, thumb, mime });
        photoId = photo.id;
      }
      await create.mutateAsync({
        speciesId,
        photoId,
        placeId: location.placeId,
        placeName: location.placeName,
        lat: location.lat,
        lng: location.lng,
        confidence,
        phenophase,
        seenAt,
        notes,
      });
      reset();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {!adding && (
        <Button onClick={() => setAdding(true)}>
          <Plus /> Add sighting
        </Button>
      )}

      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">New sighting</h3>
              <Button variant="ghost" size="icon" onClick={reset}>
                <X />
              </Button>
            </div>

            <Field label="Photo">
              <div className="space-y-2">
                <PhotoCapture
                  onFiles={async (files) => {
                    setFile(files[0] ?? null);
                    if (files[0]) {
                      const meta = await readPhotoMeta(files[0]);
                      if (meta.date) setSeenAt(meta.date);
                      if (meta.lat != null && meta.lng != null)
                        setLocation((l) => ({ ...l, lat: meta.lat, lng: meta.lng, placeId: undefined }));
                    }
                  }}
                  disabled={busy}
                />
                {file && <PhotoImg blob={file} className="h-32 w-32 rounded-md object-cover" />}
              </div>
            </Field>
            <Field label="Confidence">
              <EnumSelect vocab="confidence" value={confidence} onChange={setConfidence} />
            </Field>
            <Field label="Stage (phenophase)">
              <EnumSelect vocab="phenophase" value={phenophase} onChange={setPhenophase} />
            </Field>
            <Field label="Location">
              <LocationPicker value={location} onChange={setLocation} />
            </Field>
            <Field label="Date seen" htmlFor="seenAt">
              <Input id="seenAt" type="date" value={seenAt} onChange={(e) => setSeenAt(e.target.value)} />
            </Field>
            <Field label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </Field>

            <Button onClick={submit} disabled={busy}>
              {busy ? 'Saving…' : 'Save sighting'}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading sightings…</p>
      ) : sightings.length === 0 && !adding ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No sightings logged yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sightings.map((s) => {
            const photo = s.photoId ? photoById.get(s.photoId) : undefined;
            const place = s.placeName ?? (s.lat != null ? `${s.lat}, ${s.lng}` : undefined);
            return (
              <Card key={s.id}>
                <CardContent className="flex gap-3 p-3">
                  {photo && (
                    <PhotoImg blob={photo.thumb ?? photo.blob} className="size-16 shrink-0 rounded-md object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{s.seenAt?.slice(0, 10)}</p>
                      {s.confidence && <Badge variant="secondary">{labelFor('confidence', s.confidence)}</Badge>}
                      {s.phenophase && <Badge variant="secondary">{labelFor('phenophase', s.phenophase)}</Badge>}
                    </div>
                    {place && <p className="truncate text-sm text-muted-foreground">{place}</p>}
                    {s.notes && <p className="mt-1 line-clamp-2 text-sm">{s.notes}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive-foreground/70"
                    onClick={() => removeSighting(s)}
                  >
                    <Trash2 />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
