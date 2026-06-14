import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type SpeciesReferenceInput } from '@/lib/storage';

const store = getStore();

export function useReferenceVersions(speciesId: string) {
  return useQuery({
    queryKey: ['reference', speciesId],
    queryFn: () => store.reference.listVersions(speciesId),
    enabled: !!speciesId,
  });
}

export function useCurrentReference(speciesId: string) {
  return useQuery({
    queryKey: ['reference-current', speciesId],
    queryFn: () => store.reference.current(speciesId),
    enabled: !!speciesId,
  });
}

export function useCreateReference(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SpeciesReferenceInput) => store.reference.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reference', speciesId] });
      qc.invalidateQueries({ queryKey: ['reference-current', speciesId] });
    },
  });
}

export function useSetCurrentReference(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => store.reference.setCurrent(speciesId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reference', speciesId] });
      qc.invalidateQueries({ queryKey: ['reference-current', speciesId] });
    },
  });
}
