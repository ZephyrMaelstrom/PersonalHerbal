import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type InventoryItemInput } from '@/lib/storage';

const store = getStore();

export function useInventory() {
  return useQuery({ queryKey: ['inventory'], queryFn: () => store.inventory.list() });
}

export function useCreateInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InventoryItemInput) => store.inventory.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export function useUpdateInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<InventoryItemInput> }) =>
      store.inventory.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}

export function useDeleteInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => store.inventory.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}
