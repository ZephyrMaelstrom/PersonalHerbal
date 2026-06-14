import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/inputs/Field';
import { cn } from '@/lib/utils';
import { AI_MODELS, type AppSettings } from '@/lib/settings';
import { useSaveSettings, useSettings } from '@/features/settings/hooks';

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-3 py-1.5 text-sm transition-colors',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function SettingsScreen() {
  const { data } = useSettings();
  const save = useSaveSettings();
  const [form, setForm] = useState<AppSettings | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">AI provider</h2>
        <Field label="Anthropic API key" hint="Stored only on this device. Used only when you tap Generate.">
          <div className="flex gap-2">
            <Input
              type={showKey ? 'text' : 'password'}
              value={form.apiKey}
              onChange={(e) => set('apiKey', e.target.value)}
              placeholder="sk-ant-…"
              autoCapitalize="off"
              autoCorrect="off"
            />
            <Button type="button" variant="outline" onClick={() => setShowKey((v) => !v)}>
              {showKey ? 'Hide' : 'Show'}
            </Button>
          </div>
        </Field>
        <Field label="Default model">
          <div className="flex flex-wrap gap-2">
            {AI_MODELS.map((m) => (
              <Choice key={m.code} active={form.model === m.code} onClick={() => set('model', m.code)}>
                {m.label}
              </Choice>
            ))}
          </div>
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Region & units</h2>
        <Field label="Region / bioregion" hint="Sent as context when generating reference pages.">
          <Input value={form.region} onChange={(e) => set('region', e.target.value)} placeholder="e.g. Upper Midwest, USA" />
        </Field>
        <Field label="Units">
          <div className="flex gap-2">
            <Choice active={form.units === 'imperial'} onClick={() => set('units', 'imperial')}>
              Imperial
            </Choice>
            <Choice active={form.units === 'metric'} onClick={() => set('units', 'metric')}>
              Metric
            </Choice>
          </div>
        </Field>
      </section>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => save.mutate(form, { onSuccess: () => setSavedAt(new Date().toLocaleTimeString()) })}
          disabled={save.isPending}
        >
          {save.isPending ? 'Saving…' : 'Save settings'}
        </Button>
        {savedAt && <span className="text-xs text-muted-foreground">Saved at {savedAt}</span>}
      </div>
    </div>
  );
}
