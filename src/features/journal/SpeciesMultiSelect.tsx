import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import { useSpeciesList } from '@/features/species/hooks';

/** Multi-select over the local species list (by id), rendered as removable chips. */
export function SpeciesMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { data: species = [] } = useSpeciesList();
  const [open, setOpen] = useState(false);
  const nameOf = (id: string) => species.find((s) => s.id === id)?.scientificName ?? id;

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((id) => (
          <Badge key={id} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1 italic">
            {nameOf(id)}
            <button type="button" onClick={() => toggle(id)} aria-label={`Remove ${nameOf(id)}`} className="rounded-full p-0.5 hover:bg-background/50">
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="font-normal">
            <Plus className="size-4" /> Tag species
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0">
          <Command>
            <CommandInput placeholder="Search species…" />
            <CommandList>
              <CommandEmpty>No species.</CommandEmpty>
              <CommandGroup>
                {species.map((s) => (
                  <CommandItem key={s.id} value={`${s.scientificName} ${s.commonNames.join(' ')}`} onSelect={() => toggle(s.id)}>
                    <Check className={cn('size-4', value.includes(s.id) ? 'opacity-100' : 'opacity-0')} />
                    <span className="italic">{s.scientificName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
