import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore, type FormulaInput } from '@/lib/storage';

const store = getStore();

export function useFormulas() {
  return useQuery({ queryKey: ['formulas'], queryFn: () => store.formulas.list() });
}

export function useFormula(id: string) {
  return useQuery({ queryKey: ['formula', id], queryFn: () => store.formulas.get(id), enabled: !!id });
}

export function useCreateFormula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FormulaInput) => store.formulas.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['formulas'] }),
  });
}

export function useUpdateFormula(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<FormulaInput>) => store.formulas.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formulas'] });
      qc.invalidateQueries({ queryKey: ['formula', id] });
    },
  });
}

export function useDeleteFormula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => store.formulas.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['formulas'] }),
  });
}
