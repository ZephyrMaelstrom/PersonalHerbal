import { useEffect, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/inputs/Field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { AI_MODELS, type AppSettings } from '@/lib/settings';
import { useInstallPrompt } from '@/lib/pwa';
import { useExportBackup, useImportBackup, useSaveSettings, useSettings } from '@/features/settings/hooks';

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
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();
  const { canInstall, promptInstall } = useInstallPrompt();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [form, setForm] = useState<AppSettings | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPendingFile(f);
    e.target.value = '';
  }

  async function confirmImport() {
    if (!pendingFile) return;
    try {
      await importBackup.mutateAsync(pendingFile);
      toast({ message: 'Backup restored' });
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : 'Import failed' });
    } finally {
      setPendingFile(null);
    }
  }

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

      <section className="space-y-3 border-t pt-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Backup &amp; restore</h2>
        <p className="text-xs text-muted-foreground">
          Your data lives only on this device. Export a backup file to keep it safe or move to another phone. Importing
          replaces everything currently on this device.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={exportBackup.isPending} onClick={() => exportBackup.mutate()}>
            <Download /> {exportBackup.isPending ? 'Exporting…' : 'Export'}
          </Button>
          <Button variant="outline" disabled={importBackup.isPending} onClick={() => fileRef.current?.click()}>
            <Upload /> Import
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onPickFile} />
        </div>
      </section>

      {canInstall && (
        <section className="space-y-3 border-t pt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">App</h2>
          <Button variant="outline" onClick={promptInstall}>
            Install Verdant Codex
          </Button>
        </section>
      )}

      <Dialog open={!!pendingFile} onOpenChange={(o) => !o && setPendingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace all data?</DialogTitle>
            <DialogDescription>
              Importing “{pendingFile?.name}” will overwrite every species, note, photo, and record currently on this
              device. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingFile(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmImport} disabled={importBackup.isPending}>
              {importBackup.isPending ? 'Importing…' : 'Import & replace'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
