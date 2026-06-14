import { useQuery } from '@tanstack/react-query';
import { getStore } from '@/lib/storage';

const store = getStore();

export function useAllPreparations() {
  return useQuery({ queryKey: ['preparations-all'], queryFn: () => store.preparations.listAll() });
}

export function useAllSightings() {
  return useQuery({ queryKey: ['sightings-all'], queryFn: () => store.sightings.listAll() });
}

export function useAllHarvests() {
  return useQuery({ queryKey: ['harvests-all'], queryFn: () => store.harvests.listAll() });
}
