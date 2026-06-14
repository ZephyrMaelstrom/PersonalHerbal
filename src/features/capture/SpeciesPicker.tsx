import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useSpeciesList } from '@/features/species/hooks';

/**
 * Single-select over the local species list, with a "Create new species" affordance that
 * makes a minimal species (scientific name only) and selects it — for the quick-capture flow.
 */
export function SpeciesPicker({
  value,
  onChange,
  onCreate,
}: {
  value?: string;
  onChange: (id: string) => void;
  onCreate: (name: string) => Promise<string>;
}) {
  const { data: species = [] } = useSpeciesList();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = species.find((s) => s.id === value);

  async function create() {
    const name = search.trim();
    if (!name) return;
    const id = await onCreate(name);
    onChange(id);
    setSearch('');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className={cn('truncate italic', !selected && 'not-italic text-muted-foreground')}>
            {selected ? selected.scientificName : 'Pick or create species…'}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search or type a new name…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {search.trim() ? (
                <button type="button" onClick={create} className="mx-auto flex items-center gap-2 text-primary">
                  <Plus className="size-4" /> Create “{search.trim()}”
                </button>
              ) : (
                'No species yet.'
              )}
            </CommandEmpty>
            <CommandGroup>
              {species.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.scientificName} ${s.commonNames.join(' ')}`}
                  onSelect={() => {
                    onChange(s.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('size-4', value === s.id ? 'opacity-100' : 'opacity-0')} />
                  <span className="italic">{s.scientificName}</span>
                </CommandItem>
              ))}
              {search.trim() && !species.some((s) => s.scientificName.toLowerCase() === search.trim().toLowerCase()) && (
                <CommandItem value={`__create_${search}`} onSelect={create} className="text-primary">
                  <Plus className="size-4" /> Create “{search.trim()}”
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
