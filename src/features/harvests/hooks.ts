import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type HarvestInput } from '@/lib/storage';

const store = getStore();

export function useHarvests(speciesId: string) {
  return useQuery({
    queryKey: ['harvests', speciesId],
    queryFn: () => store.harvests.list(speciesId),
    enabled: !!speciesId,
  });
}

export function useCreateHarvest(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: HarvestInput) => store.harvests.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['harvests', speciesId] }),
  });
}

export function useDeleteHarvest(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => store.harvests.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['harvests', speciesId] }),
  });
}
