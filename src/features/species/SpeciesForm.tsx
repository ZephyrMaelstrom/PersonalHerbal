import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/inputs/Field';
import { EnumSelect } from '@/components/inputs/EnumSelect';
import { MultiSelectChips } from '@/components/inputs/MultiSelectChips';
import { TagInput } from '@/components/inputs/TagInput';
import type { SpeciesInput } from '@/lib/storage';

const EMPTY: SpeciesInput = {
  scientificName: '',
  commonNames: [],
  family: '',
  lifecycle: undefined,
  nativeStatus: undefined,
  edibility: undefined,
  conservation: undefined,
  habitats: [],
  sun: [],
  moisture: [],
  soilTexture: [],
  soilPh: undefined,
  actions: [],
  tissueAffinities: [],
  safetyFlags: [],
  harvestSeasons: [],
  energeticsTemperature: undefined,
  energeticsMoisture: undefined,
  energeticsTastes: [],
};

interface SpeciesFormProps {
  initial?: SpeciesInput;
  submitLabel?: string;
  onSubmit: (input: SpeciesInput) => void;
  pending?: boolean;
}

export function SpeciesForm({ initial, submitLabel = 'Save species', onSubmit, pending }: SpeciesFormProps) {
  const [form, setForm] = useState<SpeciesInput>(initial ?? EMPTY);
  const set = <K extends keyof SpeciesInput>(key: K, value: SpeciesInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSubmit = form.scientificName.trim().length > 0 && !pending;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ ...form, scientificName: form.scientificName.trim() });
      }}
    >
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identity</h2>
        <Field label="Scientific name" htmlFor="sci" hint="Required. Free text — e.g. Achillea millefolium.">
          <Input
            id="sci"
            value={form.scientificName}
            onChange={(e) => set('scientificName', e.target.value)}
            placeholder="Genus species"
            autoCapitalize="off"
            autoCorrect="off"
          />
        </Field>
        <Field label="Common names" hint="Type a name and press Enter to add.">
          <TagInput value={form.commonNames} onChange={(v) => set('commonNames', v)} placeholder="e.g. Yarrow" />
        </Field>
        <Field label="Family" htmlFor="family">
          <Input id="family" value={form.family ?? ''} onChange={(e) => set('family', e.target.value)} placeholder="e.g. Asteraceae" />
        </Field>
        <Field label="Lifecycle">
          <EnumSelect vocab="lifecycle" value={form.lifecycle} onChange={(v) => set('lifecycle', v)} />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status</h2>
        <Field label="Native status">
          <EnumSelect vocab="native_status" value={form.nativeStatus} onChange={(v) => set('nativeStatus', v)} />
        </Field>
        <Field label="Edibility">
          <EnumSelect vocab="edibility" value={form.edibility} onChange={(v) => set('edibility', v)} />
        </Field>
        <Field label="Conservation">
          <EnumSelect vocab="conservation" value={form.conservation} onChange={(v) => set('conservation', v)} />
        </Field>
        <Field label="Safety flags">
          <MultiSelectChips vocab="safety_flag" value={form.safetyFlags} onChange={(v) => set('safetyFlags', v)} placeholder="Add flag" />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Habitat &amp; site</h2>
        <Field label="Habitat">
          <MultiSelectChips vocab="habitat" value={form.habitats} onChange={(v) => set('habitats', v)} placeholder="Add habitat" />
        </Field>
        <Field label="Sun">
          <MultiSelectChips vocab="sun" value={form.sun} onChange={(v) => set('sun', v)} placeholder="Add sun" />
        </Field>
        <Field label="Moisture">
          <MultiSelectChips vocab="moisture" value={form.moisture} onChange={(v) => set('moisture', v)} placeholder="Add moisture" />
        </Field>
        <Field label="Soil texture">
          <MultiSelectChips vocab="soil_texture" value={form.soilTexture} onChange={(v) => set('soilTexture', v)} placeholder="Add texture" />
        </Field>
        <Field label="Soil pH">
          <EnumSelect vocab="soil_ph" value={form.soilPh} onChange={(v) => set('soilPh', v)} />
        </Field>
        <Field label="Harvest seasons">
          <MultiSelectChips vocab="harvest_season" value={form.harvestSeasons} onChange={(v) => set('harvestSeasons', v)} placeholder="Add season" />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Materia medica</h2>
        <Field label="Herbal actions">
          <MultiSelectChips vocab="action" value={form.actions} onChange={(v) => set('actions', v)} placeholder="Add action" />
        </Field>
        <Field label="Tissue affinities / systems">
          <MultiSelectChips vocab="tissue_affinity" value={form.tissueAffinities} onChange={(v) => set('tissueAffinities', v)} placeholder="Add system" />
        </Field>
        <Field label="Energetics — temperature">
          <EnumSelect vocab="energetics_temperature" value={form.energeticsTemperature} onChange={(v) => set('energeticsTemperature', v)} />
        </Field>
        <Field label="Energetics — moisture">
          <EnumSelect vocab="energetics_moisture" value={form.energeticsMoisture} onChange={(v) => set('energeticsMoisture', v)} />
        </Field>
        <Field label="Energetics — taste">
          <MultiSelectChips vocab="energetics_taste" value={form.energeticsTastes} onChange={(v) => set('energeticsTastes', v)} placeholder="Add taste" />
        </Field>
      </section>

      <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}

export { EMPTY as EMPTY_SPECIES };
