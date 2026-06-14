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

  const [file, setFile] = useState<File | null>(null);
  const [speciesId, setSpeciesId] = useState<string>();
  const [createdNew, setCreatedNew] = useState(false);
  const [confidence, setConfidence] = useState<string>();
  const [location, setLocation] = useState<LocationValue>({});
  const [seenAt, setSeenAt] = useState(today());
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

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
      let photoId: string | undefined;
      if (file) {
        const { blob, mime } = await processImage(file);
        const photo = await store.photos.add({ speciesId, blob, mime });
        photoId = photo.id;
        // First photo of a brand-new species becomes its main photo.
        if (createdNew) await store.species.update(speciesId, { mainPhotoId: photo.id });
      }
      await store.sightings.create({
        speciesId,
        photoId,
        placeId: location.placeId,
        placeName: location.placeName,
        lat: location.lat,
        lng: location.lng,
        confidence,
        seenAt,
        notes,
      });
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

      <Field label="Photo">
        <div className="space-y-2">
          <PhotoCapture onFiles={(files) => setFile(files[0] ?? null)} disabled={busy} />
          {file && <PhotoImg blob={file} className="h-40 w-40 rounded-md object-cover" />}
        </div>
      </Field>

      <Field label="Species" hint="Pick an existing species or type a new name to create one.">
        <SpeciesPicker value={speciesId} onChange={setSpeciesId} onCreate={createSpecies} />
      </Field>

      <Field label="Confidence">
        <EnumSelect vocab="confidence" value={confidence} onChange={setConfidence} />
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
