import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type PhotoInput } from '@/lib/storage';

const store = getStore();

export function useSpeciesPhotos(speciesId: string) {
  return useQuery({
    queryKey: ['photos', speciesId],
    queryFn: () => store.photos.listForSpecies(speciesId),
    enabled: !!speciesId,
  });
}

/** Load a single photo by id (used for the species' main thumbnail). */
export function usePhoto(id?: string) {
  return useQuery({
    queryKey: ['photo', id],
    queryFn: () => (id ? store.photos.get(id) : undefined),
    enabled: !!id,
  });
}

export function useAddPhoto(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PhotoInput) => store.photos.add(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos', speciesId] }),
  });
}

export function useDeletePhoto(speciesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => store.photos.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos', speciesId] }),
  });
}
