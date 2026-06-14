import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type AudioNoteInput } from '@/lib/storage';

const store = getStore();

export function useSpeciesAudio(speciesId: string) {
  return useQuery({
    queryKey: ['audio', speciesId],
    queryFn: () => store.audio.listForSpecies(speciesId),
    enabled: !!speciesId,
  });
}

export function useAddAudio(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AudioNoteInput) => store.audio.add(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audio', speciesId] }),
  });
}

export function useDeleteAudio(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => store.audio.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audio', speciesId] }),
  });
}
