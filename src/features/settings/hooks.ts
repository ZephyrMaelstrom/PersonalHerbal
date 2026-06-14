import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type BackupData } from '@/lib/storage';
import { loadSettings, saveSettings, type AppSettings } from '@/lib/settings';

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
