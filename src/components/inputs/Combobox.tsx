import { useMemo, useState } from 'react';
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
import { useVocab } from '@/lib/vocab-hooks';
import type { VocabId } from '@/lib/vocab';
import { cn } from '@/lib/utils';

interface ComboboxProps {
  vocab: VocabId;
  value?: string;
  onChange: (code: string | undefined) => void;
  placeholder?: string;
  allowCreate?: boolean;
  id?: string;
}

/**
 * Single-select, searchable dropdown over a controlled vocabulary. Typing a value that
 * doesn't exist offers "Add", which persists it as user vocab and selects it.
 */
export function Combobox({
  vocab,
  value,
  onChange,
  placeholder = 'Select…',
  allowCreate = true,
  id,
}: ComboboxProps) {
  const { terms, addTerm } = useVocab(vocab);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = terms.find((t) => t.code === value);
  const exactMatch = useMemo(
    () => terms.some((t) => t.label.toLowerCase() === search.trim().toLowerCase()),
    [terms, search],
  );

  async function handleCreate() {
    const term = await addTerm(search);
    onChange(term.code);
    setSearch('');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {allowCreate && search.trim() ? (
                <button
                  type="button"
                  onClick={handleCreate}
                  className="mx-auto flex items-center gap-2 text-primary"
                >
                  <Plus className="size-4" /> Add “{search.trim()}”
                </button>
              ) : (
                'No match.'
              )}
            </CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(undefined);
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  Clear selection
                </CommandItem>
              )}
              {terms.map((t) => (
                <CommandItem
                  key={t.code}
                  value={t.label}
                  onSelect={() => {
                    onChange(t.code === value ? undefined : t.code);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('size-4', value === t.code ? 'opacity-100' : 'opacity-0')} />
                  {t.label}
                </CommandItem>
              ))}
              {allowCreate && search.trim() && !exactMatch && (
                <CommandItem value={`__create_${search}`} onSelect={handleCreate} className="text-primary">
                  <Plus className="size-4" /> Add “{search.trim()}”
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
