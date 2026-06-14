import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/inputs/Field';
import { EnumSelect } from '@/components/inputs/EnumSelect';
import { TagInput } from '@/components/inputs/TagInput';
import { VoiceNotes } from '@/features/audio/VoiceNotes';
import { useSaveNotes, useSpeciesNotes } from './hooks';
import type { SpeciesNotes } from '@/lib/storage';

const blank = (speciesId: string): SpeciesNotes => ({
  speciesId,
  personalIdConfidence: undefined,
  firstSeenAt: undefined,
  freeNotes: '',
  tasteNotes: '',
  smellNotes: '',
  customTags: [],
  updatedAt: new Date().toISOString(),
});

export function NotesTab({ speciesId }: { speciesId: string }) {
  const { data, isLoading } = useSpeciesNotes(speciesId);
  const save = useSaveNotes(speciesId);
  const [form, setForm] = useState<SpeciesNotes>(blank(speciesId));
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = <K extends keyof SpeciesNotes>(key: K, value: SpeciesNotes[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading notes…</p>;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(form, { onSuccess: () => setSavedAt(new Date().toLocaleTimeString()) });
      }}
    >
      <p className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
        Your private layer. Nothing here is ever sent to AI or overwritten by a generated reference page.
      </p>

      <Field label="Personal ID confidence">
        <EnumSelect vocab="confidence" value={form.personalIdConfidence} onChange={(v) => set('personalIdConfidence', v)} />
      </Field>
      <Field label="First seen" htmlFor="firstSeen">
        <Input
          id="firstSeen"
          type="date"
          value={form.firstSeenAt?.slice(0, 10) ?? ''}
          onChange={(e) => set('firstSeenAt', e.target.value || undefined)}
        />
      </Field>
      <Field label="Field notes">
        <Textarea value={form.freeNotes} onChange={(e) => set('freeNotes', e.target.value)} placeholder="Observations, locations, anything…" rows={5} />
      </Field>
      <Field label="Taste notes">
        <Textarea value={form.tasteNotes} onChange={(e) => set('tasteNotes', e.target.value)} rows={2} />
      </Field>
      <Field label="Smell notes">
        <Textarea value={form.smellNotes} onChange={(e) => set('smellNotes', e.target.value)} rows={2} />
      </Field>
      <Field label="Custom tags">
        <TagInput value={form.customTags} onChange={(v) => set('customTags', v)} />
      </Field>
      <Field label="Voice notes">
        <VoiceNotes speciesId={speciesId} />
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save notes'}
        </Button>
        {savedAt && <span className="text-xs text-muted-foreground">Saved at {savedAt}</span>}
      </div>
    </form>
  );
}
