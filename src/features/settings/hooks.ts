import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
