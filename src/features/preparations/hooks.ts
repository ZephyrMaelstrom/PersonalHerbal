import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type PreparationInput } from '@/lib/storage';

const store = getStore();

export function usePreparations(speciesId: string) {
  return useQuery({
    queryKey: ['preparations', speciesId],
    queryFn: () => store.preparations.list(speciesId),
    enabled: !!speciesId,
  });
}

export function useCreatePreparation(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PreparationInput) => store.preparations.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['preparations', speciesId] }),
  });
}

export function useUpdatePreparation(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<PreparationInput> }) =>
      store.preparations.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['preparations', speciesId] }),
  });
}

export function useDeletePreparation(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => store.preparations.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['preparations', speciesId] }),
  });
}
