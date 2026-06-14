import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStore } from '@/lib/storage';
import { mergeVocab, type VocabId, type VocabTerm } from '@/lib/vocab';
import { humanizeCode } from '@/lib/vocab/types';

/**
 * Loads a controlled vocabulary merged with any user-added terms, and exposes a way to
 * persist new custom terms so they reappear in future dropdowns.
 */
export function useVocab(id: VocabId) {
  const store = getStore();
  const qc = useQueryClient();

  const { data: userTerms = [] } = useQuery({
    queryKey: ['vocab', id],
    queryFn: () => store.userVocab.list(id),
  });

  const terms = mergeVocab(id, userTerms);

  const addTerm = useCallback(
    async (rawCode: string): Promise<VocabTerm> => {
      const code = rawCode.trim().toLowerCase().replace(/\s+/g, '_');
      const term: VocabTerm = { code, label: humanizeCode(rawCode.trim()) };
      await store.userVocab.add(id, term);
      await qc.invalidateQueries({ queryKey: ['vocab', id] });
      return term;
    },
    [id, qc, store],
  );

  return { terms, addTerm };
}
