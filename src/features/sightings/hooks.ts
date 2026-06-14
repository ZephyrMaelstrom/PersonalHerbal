import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type SightingInput } from '@/lib/storage';

const store = getStore();

export function useSightings(speciesId: string) {
  return useQuery({
    queryKey: ['sightings', speciesId],
    queryFn: () => store.sightings.list(speciesId),
    enabled: !!speciesId,
  });
}

export function useCreateSighting(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SightingInput) => store.sightings.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sightings', speciesId] }),
  });
}

export function useDeleteSighting(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => store.sightings.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sightings', speciesId] });
      qc.invalidateQueries({ queryKey: ['photos', speciesId] });
    },
  });
}
