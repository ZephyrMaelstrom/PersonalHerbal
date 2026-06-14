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
import type { BackupData, SnapshotMeta } from '@/lib/storage';
import { useInstallPrompt } from '@/lib/pwa';
import {
  useCloudBackup,
  useExportBackup,
  useImportBackup,
  useRestoreSnapshot,
  useSaveSettings,
  useSettings,
  useSnapshots,
} from '@/features/settings/hooks';
import { useSpeciesList } from '@/features/species/hooks';
import { COLLECTION_FORMATS, buildFieldGuideHtml } from '@/lib/export/collection';
import { deliver, printHtml } from '@/lib/export/share';

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
  const { data: currentSpecies = [] } = useSpeciesList();
  const { data: snapshots = [] } = useSnapshots();
  const restoreSnapshot = useRestoreSnapshot();
  const cloudBackup = useCloudBackup();
  const { toast } = useToast();

  function backupToCloud() {
    cloudBackup.mutate(true, {
      onSuccess: () => toast({ message: 'Backed up to Google Drive' }),
      onError: (err) => toast({ message: err instanceof Error ? err.message : 'Cloud backup failed' }),
    });
  }
  const [pendingRestore, setPendingRestore] = useState<SnapshotMeta | null>(null);

  const [exporting, setExporting] = useState<string>();
  async function runCollectionExport(id: string) {
    const fmt = COLLECTION_FORMATS.find((f) => f.id === id);
    if (!fmt) return;
    setExporting(id);
    try {
      await deliver(await fmt.build());
    } catch {
      toast({ message: 'Export failed.' });
    } finally {
      setExporting(undefined);
    }
  }

  function confirmRestore() {
    if (!pendingRestore) return;
    restoreSnapshot.mutate(pendingRestore.id, {
      onSuccess: () => {
        toast({ message: 'Restored from a restore point' });
        setPendingRestore(null);
      },
      onError: (err) => toast({ message: err instanceof Error ? err.message : 'Restore failed' }),
    });
  }
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ data: BackupData; name: string } | null>(null);
  const [form, setForm] = useState<AppSettings | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text()) as BackupData;
      if (parsed.app !== 'verdant-codex' || !Array.isArray(parsed.species)) {
        toast({ message: "That doesn't look like a Verdant Codex backup file." });
        return;
      }
      setPending({ data: parsed, name: f.name });
    } catch {
      toast({ message: "Couldn't read that file as a backup." });
    }
  }

  function confirmImport() {
    if (!pending) return;
    importBackup.mutate(pending.data, {
      onSuccess: (snapshot) => {
        toast({
          message: 'Data replaced from backup',
          actionLabel: 'Undo',
          onAction: () => importBackup.mutate(snapshot),
        });
        setPending(null);
      },
      onError: (err) => toast({ message: err instanceof Error ? err.message : 'Import failed' }),
    });
  }

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  async function enableNotifications() {
    if (typeof Notification === 'undefined') {
      toast({ message: 'Notifications are not supported here.' });
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') set('notifications', true);
    else toast({ message: 'Notification permission was not granted.' });
  }

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

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Progress &amp; achievements</h2>
        <Field label="Gamification" hint="Adds a streak, level, and achievements. Off by default.">
          <div className="flex gap-2">
            <Choice active={form.gamification} onClick={() => set('gamification', true)}>
              On
            </Choice>
            <Choice active={!form.gamification} onClick={() => set('gamification', false)}>
              Off
            </Choice>
          </div>
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Appearance</h2>
        <Field label="Theme">
          <div className="flex gap-2">
            <Choice active={form.theme === 'forest'} onClick={() => set('theme', 'forest')}>
              Forest (dark)
            </Choice>
            <Choice active={form.theme === 'parchment'} onClick={() => set('theme', 'parchment')}>
              Parchment (light)
            </Choice>
          </div>
        </Field>
        <Field label="Text size">
          <div className="flex gap-2">
            <Choice active={form.textScale === 'normal'} onClick={() => set('textScale', 'normal')}>
              Normal
            </Choice>
            <Choice active={form.textScale === 'large'} onClick={() => set('textScale', 'large')}>
              Large
            </Choice>
          </div>
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Reminders</h2>
        <Field label="Preparation reminders" hint="Notifies you when a preparation is ready to press, when you open the app.">
          <div className="flex gap-2">
            <Choice active={form.notifications} onClick={enableNotifications}>
              On
            </Choice>
            <Choice active={!form.notifications} onClick={() => set('notifications', false)}>
              Off
            </Choice>
          </div>
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cloud backup</h2>
        <p className="text-xs text-muted-foreground">
          Off-device backup to your own Google Drive (no app server). Requires a Google OAuth Client ID (Web) with this
          site as an authorized origin — create one in Google Cloud Console. Save settings, then “Back up now” once to
          grant access; after that, auto-backup can run silently.
        </p>
        <Field label="Provider">
          <div className="flex gap-2">
            <Choice active={form.cloudProvider === 'none'} onClick={() => set('cloudProvider', 'none')}>
              None
            </Choice>
            <Choice active={form.cloudProvider === 'gdrive'} onClick={() => set('cloudProvider', 'gdrive')}>
              Google Drive
            </Choice>
          </div>
        </Field>
        {form.cloudProvider === 'gdrive' && (
          <>
            <Field label="Google OAuth Client ID" htmlFor="gcid">
              <Input
                id="gcid"
                value={form.gdriveClientId}
                onChange={(e) => set('gdriveClientId', e.target.value)}
                placeholder="…apps.googleusercontent.com"
                autoCapitalize="off"
                autoCorrect="off"
              />
            </Field>
            <Field label="Auto-backup" hint="Silently back up once a day when you open the app (after first consent).">
              <div className="flex gap-2">
                <Choice active={form.cloudAuto} onClick={() => set('cloudAuto', true)}>
                  On
                </Choice>
                <Choice active={!form.cloudAuto} onClick={() => set('cloudAuto', false)}>
                  Off
                </Choice>
              </div>
            </Field>
            <div className="flex items-center gap-3">
              <Button variant="outline" disabled={cloudBackup.isPending} onClick={backupToCloud}>
                {cloudBackup.isPending ? 'Backing up…' : 'Back up now'}
              </Button>
              {data?.lastCloudBackupAt && (
                <span className="text-xs text-muted-foreground">Last: {new Date(data.lastCloudBackupAt).toLocaleString()}</span>
              )}
            </div>
          </>
        )}
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
          Your data lives only on this device. <strong>Export</strong> downloads a backup file to keep it safe.
          <strong> Import</strong> replaces everything on this device with a file — it shows you what's in the file
          first, and you can undo it.
        </p>
        <Button className="w-full" disabled={exportBackup.isPending} onClick={() => exportBackup.mutate()}>
          <Download /> {exportBackup.isPending ? 'Exporting…' : `Export backup (${currentSpecies.length} species)`}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          disabled={importBackup.isPending}
          onClick={() => fileRef.current?.click()}
        >
          <Upload /> Import / restore from a file
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onPickFile} />
      </section>

      <section className="space-y-3 border-t pt-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Export for use elsewhere</h2>
        <p className="text-xs text-muted-foreground">
          Human-readable CSVs for spreadsheets and other tools. (Backup/restore above is the full-fidelity copy;
          these are for sharing and analysis.) More formats will be added over time.
        </p>
        <div className="flex flex-wrap gap-2">
          {COLLECTION_FORMATS.map((f) => (
            <Button key={f.id} variant="outline" size="sm" disabled={!!exporting} onClick={() => runCollectionExport(f.id)}>
              <Download /> {exporting === f.id ? 'Preparing…' : f.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={async () => printHtml(await buildFieldGuideHtml())}>
            <Download /> Print field guide
          </Button>
        </div>
      </section>

      <section className="space-y-3 border-t pt-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Restore points</h2>
        <p className="text-xs text-muted-foreground">
          The app automatically keeps the last few on-device snapshots of your data (and one taken right before any
          import). If something goes wrong, restore one here.
        </p>
        {snapshots.length === 0 ? (
          <p className="text-xs text-muted-foreground">No restore points yet — one is taken automatically as you use the app.</p>
        ) : (
          <div className="space-y-2">
            {snapshots.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-md border p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {new Date(s.createdAt).toLocaleString()}
                    {s.reason === 'pre-import' && <span className="ml-2 text-xs text-muted-foreground">(before import)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.speciesCount} species · {s.photoCount} photos
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPendingRestore(s)}>
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {canInstall && (
        <section className="space-y-3 border-t pt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">App</h2>
          <Button variant="outline" onClick={promptInstall}>
            Install Verdant Codex
          </Button>
        </section>
      )}

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace all data?</DialogTitle>
            <DialogDescription>
              This replaces everything on this device with the contents of “{pending?.name}”. You'll be able to undo it.
            </DialogDescription>
          </DialogHeader>
          {pending && (
            <div className="space-y-2 text-sm">
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">The file contains</p>
                <p>
                  {pending.data.species.length} species · {pending.data.photos?.length ?? 0} photos ·{' '}
                  {pending.data.sightings?.length ?? 0} sightings
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                You currently have <strong>{currentSpecies.length}</strong> species on this device.
              </p>
              {pending.data.species.length === 0 && (
                <p className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-2 text-xs text-yellow-300">
                  ⚠ This file has no species. Importing it will leave you with an empty codex. Make sure this is the file
                  you meant.
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmImport} disabled={importBackup.isPending}>
              {importBackup.isPending ? 'Importing…' : 'Import & replace'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingRestore} onOpenChange={(o) => !o && setPendingRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore this point?</DialogTitle>
            <DialogDescription>
              This replaces your current data with the snapshot from{' '}
              {pendingRestore && new Date(pendingRestore.createdAt).toLocaleString()} ({pendingRestore?.speciesCount}{' '}
              species). Your current data is snapshotted first, so this is reversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingRestore(null)}>
              Cancel
            </Button>
            <Button onClick={confirmRestore} disabled={restoreSnapshot.isPending}>
              {restoreSnapshot.isPending ? 'Restoring…' : 'Restore'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
