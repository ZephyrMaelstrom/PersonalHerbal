import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type BackupData } from '@/lib/storage';
import { loadSettings, saveSettings, type AppSettings } from '@/lib/settings';
import { gdriveBackup } from '@/lib/cloud/gdrive';

const AUTO_BACKUP_INTERVAL_MS = 20 * 60 * 60 * 1000; // ~daily

async function buildBackupBlob(): Promise<{ blob: Blob; filename: string }> {
  const data = await getStore().backup.exportAll();
  return {
    blob: new Blob([JSON.stringify(data)], { type: 'application/json' }),
    filename: `verdant-codex-backup-${new Date().toISOString().slice(0, 10)}.json`,
  };
}

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: async () => loadSettings() });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: AppSettings) => {
      saveSettings(settings);
      return settings;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

/** Export all local data + photos to a downloaded .json file. */
export function useExportBackup() {
  return useMutation({
    mutationFn: async () => {
      const data = await getStore().backup.exportAll();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verdant-codex-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return data;
    },
  });
}

/** Manual cloud backup (interactive consent if needed). */
export function useCloudBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (interactive: boolean) => {
      const s = loadSettings();
      if (s.cloudProvider !== 'gdrive') throw new Error('Choose a cloud provider in Settings.');
      const { blob, filename } = await buildBackupBlob();
      await gdriveBackup(s.gdriveClientId, blob, filename, interactive);
      saveSettings({ ...loadSettings(), lastCloudBackupAt: new Date().toISOString() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

/** Silent cloud backup on app open when enabled, configured, online, and stale. */
export function useCloudAutoBackup() {
  const qc = useQueryClient();
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void (async () => {
      const s = loadSettings();
      if (!s.cloudAuto || s.cloudProvider !== 'gdrive' || !s.gdriveClientId.trim()) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      const last = s.lastCloudBackupAt ? Date.parse(s.lastCloudBackupAt) : 0;
      if (Date.now() - last < AUTO_BACKUP_INTERVAL_MS) return;
      try {
        const { blob, filename } = await buildBackupBlob();
        await gdriveBackup(s.gdriveClientId, blob, filename, false);
        saveSettings({ ...loadSettings(), lastCloudBackupAt: new Date().toISOString() });
        qc.invalidateQueries({ queryKey: ['settings'] });
      } catch {
        // Silent: typically means consent is needed — the user can run a manual backup once.
      }
    })();
  }, [qc]);
}

/** Load the Gen 1 FloraDex seed (idempotent — skips species you already have). */
export function useSeedGen1() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { seedGen1 } = await import('@/features/seed/seed');
      return seedGen1();
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

/** On-device automatic restore points. */
export function useSnapshots() {
  return useQuery({ queryKey: ['snapshots'], queryFn: () => getStore().snapshots.list() });
}

export function useRestoreSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getStore().snapshots.capture('pre-import'); // make the current state recoverable too
      await getStore().snapshots.restore(id);
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

/** Replace all local data with a backup, returning a snapshot of the PRIOR data for undo. */
export function useImportBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: BackupData) => {
      // Durable pre-import restore point (survives even if the user navigates away), plus an
      // in-memory snapshot returned for the immediate Undo toast.
      const snapshot = await getStore().backup.exportAll();
      await getStore().snapshots.capture('pre-import');
      await getStore().backup.importAll(data);
      return snapshot;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}
