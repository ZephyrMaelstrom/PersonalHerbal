import { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface MultiSelectChipsProps {
  vocab: VocabId;
  value: string[];
  onChange: (codes: string[]) => void;
  placeholder?: string;
  allowCreate?: boolean;
}

/** Multi-select over a controlled vocabulary, rendered as removable chips. */
export function MultiSelectChips({
  vocab,
  value,
  onChange,
  placeholder = 'Add…',
  allowCreate = true,
}: MultiSelectChipsProps) {
  const { terms, addTerm } = useVocab(vocab);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const exactMatch = useMemo(
    () => terms.some((t) => t.label.toLowerCase() === search.trim().toLowerCase()),
    [terms, search],
  );

  function toggle(code: string) {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);
  }

  async function handleCreate() {
    const term = await addTerm(search);
    if (!value.includes(term.code)) onChange([...value, term.code]);
    setSearch('');
  }

  const labelOf = (code: string) => terms.find((t) => t.code === code)?.label ?? code;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((code) => (
          <Badge key={code} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1">
            {labelOf(code)}
            <button
              type="button"
              onClick={() => toggle(code)}
              className="rounded-full p-0.5 hover:bg-background/50"
              aria-label={`Remove ${labelOf(code)}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="font-normal">
            <Plus className="size-4" /> {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0">
          <Command>
            <CommandInput placeholder="Search…" value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                {allowCreate && search.trim() ? (
                  <button type="button" onClick={handleCreate} className="mx-auto flex items-center gap-2 text-primary">
                    <Plus className="size-4" /> Add “{search.trim()}”
                  </button>
                ) : (
                  'No match.'
                )}
              </CommandEmpty>
              <CommandGroup>
                {terms.map((t) => (
                  <CommandItem key={t.code} value={t.label} onSelect={() => toggle(t.code)}>
                    <Check className={cn('size-4', value.includes(t.code) ? 'opacity-100' : 'opacity-0')} />
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
    </div>
  );
}
