import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type PlaceInput } from '@/lib/storage';

const store = getStore();

export function usePlaces() {
  return useQuery({ queryKey: ['places'], queryFn: () => store.places.list() });
}

export function useCreatePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceInput) => store.places.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['places'] }),
  });
}
