import { useState } from 'react';
import { Check, ChevronsUpDown, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { usePlaces, useCreatePlace } from './hooks';

export interface LocationValue {
  placeId?: string;
  placeName?: string;
  lat?: number;
  lng?: number;
}

/**
 * Location entry per spec: pick a previously-used named place, one-tap GPS, or manual
 * lat/lng. Typing a new name in the dropdown saves it as a reusable Place (capturing the
 * current GPS fix if one was just taken).
 */
export function LocationPicker({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}) {
  const { data: places = [] } = usePlaces();
  const createPlace = useCreatePlace();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [manual, setManual] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>();

  const selectedPlace = places.find((p) => p.id === value.placeId);
  const label = selectedPlace?.name ?? value.placeName ?? 'Select place…';

  function takeGps() {
    if (!('geolocation' in navigator)) {
      setGpsStatus('Geolocation not available on this device.');
      return;
    }
    setGpsStatus('Locating…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus(undefined);
        onChange({
          ...value,
          placeId: undefined,
          lat: +pos.coords.latitude.toFixed(6),
          lng: +pos.coords.longitude.toFixed(6),
        });
      },
      (err) => setGpsStatus(err.message || 'Could not get location.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function createFromSearch() {
    const name = search.trim();
    if (!name) return;
    const place = await createPlace.mutateAsync({
      name,
      lat: value.lat,
      lng: value.lng,
      habitats: [],
    });
    onChange({ placeId: place.id, placeName: place.name, lat: place.lat, lng: place.lng });
    setSearch('');
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" role="combobox" className="flex-1 justify-between font-normal">
              <span className={cn('truncate', !selectedPlace && !value.placeName && 'text-muted-foreground')}>
                {label}
              </span>
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search or add place…" value={search} onValueChange={setSearch} />
              <CommandList>
                <CommandEmpty>
                  {search.trim() ? (
                    <button type="button" onClick={createFromSearch} className="mx-auto flex items-center gap-2 text-primary">
                      <Plus className="size-4" /> Add “{search.trim()}”
                    </button>
                  ) : (
                    'No places yet.'
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {value.placeId && (
                    <CommandItem
                      value="__clear__"
                      onSelect={() => {
                        onChange({ ...value, placeId: undefined, placeName: undefined });
                        setOpen(false);
                      }}
                      className="text-muted-foreground"
                    >
                      Clear place
                    </CommandItem>
                  )}
                  {places.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.name}
                      onSelect={() => {
                        onChange({ placeId: p.id, placeName: p.name, lat: p.lat, lng: p.lng });
                        setOpen(false);
                      }}
                    >
                      <Check className={cn('size-4', value.placeId === p.id ? 'opacity-100' : 'opacity-0')} />
                      {p.name}
                    </CommandItem>
                  ))}
                  {search.trim() && !places.some((p) => p.name.toLowerCase() === search.trim().toLowerCase()) && (
                    <CommandItem value={`__create_${search}`} onSelect={createFromSearch} className="text-primary">
                      <Plus className="size-4" /> Add “{search.trim()}”
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button type="button" variant="outline" size="icon" onClick={takeGps} title="Use current location">
          <MapPin />
        </Button>
      </div>

      {(value.lat != null || value.lng != null) && (
        <p className="text-xs text-muted-foreground">
          📍 {value.lat ?? '—'}, {value.lng ?? '—'}
          {!value.placeId && search.trim() === '' && ' (unsaved — type a name above to save as a place)'}
        </p>
      )}
      {gpsStatus && <p className="text-xs text-muted-foreground">{gpsStatus}</p>}

      <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setManual((m) => !m)}>
        {manual ? 'Hide manual lat/lng' : 'Enter lat/lng manually'}
      </button>
      {manual && (
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="lat"
            value={value.lat ?? ''}
            onChange={(e) => onChange({ ...value, lat: e.target.value ? +e.target.value : undefined })}
          />
          <Input
            type="number"
            inputMode="decimal"
            placeholder="lng"
            value={value.lng ?? ''}
            onChange={(e) => onChange({ ...value, lng: e.target.value ? +e.target.value : undefined })}
          />
        </div>
      )}
    </div>
  );
}
