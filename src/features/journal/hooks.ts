import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type JournalEntryInput } from '@/lib/storage';

const store = getStore();

export function useJournal() {
  return useQuery({ queryKey: ['journal'], queryFn: () => store.journal.list() });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: JournalEntryInput) => store.journal.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal'] }),
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => store.journal.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal'] }),
  });
}
