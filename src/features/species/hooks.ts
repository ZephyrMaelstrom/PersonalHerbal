import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type SpeciesInput, type SpeciesNotes } from '@/lib/storage';

const store = getStore();

export function useSpeciesList() {
  return useQuery({ queryKey: ['species'], queryFn: () => store.species.list() });
}

export function useSpecies(id: string) {
  return useQuery({ queryKey: ['species', id], queryFn: () => store.species.get(id), enabled: !!id });
}

export function useCreateSpecies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SpeciesInput) => store.species.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['species'] }),
  });
}

export function useUpdateSpecies(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<SpeciesInput>) => store.species.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['species'] });
      qc.invalidateQueries({ queryKey: ['species', id] });
    },
  });
}

export function useDeleteSpecies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => store.species.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['species'] }),
  });
}

export function useSpeciesNotes(speciesId: string) {
  return useQuery({
    queryKey: ['notes', speciesId],
    queryFn: () => store.notes.get(speciesId),
    enabled: !!speciesId,
  });
}

export function useSaveNotes(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes: SpeciesNotes) => store.notes.upsert(notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', speciesId] }),
  });
}
