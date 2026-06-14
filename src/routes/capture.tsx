import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/inputs/Field';
import { EnumSelect } from '@/components/inputs/EnumSelect';
import { useToast } from '@/components/ui/toast';
import { getStore } from '@/lib/storage';
import { EMPTY_SPECIES } from '@/features/species/SpeciesForm';
import { PhotoCapture } from '@/features/photos/PhotoCapture';
import { PhotoImg } from '@/features/photos/PhotoImg';
import { processImage } from '@/features/photos/image';
import { readPhotoMeta } from '@/features/photos/exif';
import { LocationPicker, type LocationValue } from '@/features/places/LocationPicker';
import { SpeciesPicker } from '@/features/capture/SpeciesPicker';

const today = () => new Date().toISOString().slice(0, 10);
const store = getStore();

/**
 * Quick capture: snap a photo, pick or create a species, drop a pin, save a sighting — the
 * lowest-friction way to log a find in the field. Talks to the store directly because the
 * species id only exists after creation (can't drive feature hooks conditionally).
 */
export function CaptureScreen() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [files, setFiles] = useState<File[]>([]);
  const [speciesId, setSpeciesId] = useState<string>();
  const [createdNew, setCreatedNew] = useState(false);
  const [confidence, setConfidence] = useState<string>();
  const [phenophase, setPhenophase] = useState<string>();
  const [location, setLocation] = useState<LocationValue>({});
  const [seenAt, setSeenAt] = useState(today());
  const [notes, setNotes] = useState('');
  const [autofilled, setAutofilled] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onFiles(picked: File[]) {
    setFiles(picked);
    // Auto-fill date & location from the first photo's EXIF, if available.
    const meta = await readPhotoMeta(picked[0]);
    if (meta.date) setSeenAt(meta.date);
    if (meta.lat != null && meta.lng != null) setLocation((l) => ({ ...l, lat: meta.lat, lng: meta.lng, placeId: undefined }));
    if (meta.date || meta.lat != null) setAutofilled(true);
  }

  async function createSpecies(name: string): Promise<string> {
    const created = await store.species.create({ ...EMPTY_SPECIES, scientificName: name });
    setCreatedNew(true);
    qc.invalidateQueries({ queryKey: ['species'] });
    return created.id;
  }

  async function save() {
    if (!speciesId) return;
    setBusy(true);
    try {
      const sighting = await store.sightings.create({
        speciesId,
        placeId: location.placeId,
        placeName: location.placeName,
        lat: location.lat,
        lng: location.lng,
        confidence,
        phenophase,
        seenAt,
        notes,
      });
      // Add all selected photos, linked to this sighting; the first is the representative.
      let firstPhotoId: string | undefined;
      for (const f of files) {
        const { blob, mime } = await processImage(f);
        const photo = await store.photos.add({ speciesId, sightingId: sighting.id, blob, mime });
        firstPhotoId ??= photo.id;
      }
      if (firstPhotoId) {
        await store.sightings.update(sighting.id, { photoId: firstPhotoId });
        if (createdNew) await store.species.update(speciesId, { mainPhotoId: firstPhotoId });
      }
      qc.invalidateQueries();
      toast({ message: 'Sighting logged' });
      navigate({ to: '/species/$speciesId', params: { speciesId } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/">
          <ArrowLeft /> Cancel
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">Quick capture</h1>

      <Field label="Photos">
        <div className="space-y-2">
          <PhotoCapture onFiles={onFiles} disabled={busy} />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.slice(0, 4).map((f, i) => (
                <PhotoImg key={i} blob={f} className="size-20 rounded-md object-cover" />
              ))}
              {files.length > 4 && <span className="self-center text-xs text-muted-foreground">+{files.length - 4} more</span>}
            </div>
          )}
          {autofilled && <p className="text-xs text-muted-foreground">Date/location filled from photo.</p>}
        </div>
      </Field>

      <Field label="Species" hint="Pick an existing species or type a new name to create one.">
        <SpeciesPicker value={speciesId} onChange={setSpeciesId} onCreate={createSpecies} />
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

      <Button className="w-full" size="lg" disabled={!speciesId || busy} onClick={save}>
        {busy ? 'Saving…' : 'Log sighting'}
      </Button>
    </div>
  );
}
