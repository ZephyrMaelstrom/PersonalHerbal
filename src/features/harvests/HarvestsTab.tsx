import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/inputs/Field';
import { EnumSelect } from '@/components/inputs/EnumSelect';
import { MultiSelectChips } from '@/components/inputs/MultiSelectChips';
import { useToast } from '@/components/ui/toast';
import { LocationPicker, type LocationValue } from '@/features/places/LocationPicker';
import { labelFor } from '@/lib/vocab';
import { useCreateHarvest, useDeleteHarvest, useHarvests } from './hooks';

const today = () => new Date().toISOString().slice(0, 10);

export function HarvestsTab({ speciesId }: { speciesId: string }) {
  const { data: harvests = [], isLoading } = useHarvests(speciesId);
  const create = useCreateHarvest(speciesId);
  const del = useDeleteHarvest(speciesId);
  const { toast } = useToast();

  function removeHarvest(h: (typeof harvests)[number]) {
    del.mutate(h.id);
    toast({
      message: 'Harvest deleted',
      actionLabel: 'Undo',
      onAction: () =>
        create.mutate({
          speciesId,
          plantPart: h.plantPart,
          amount: h.amount,
          amountUnit: h.amountUnit,
          condition: h.condition,
          placeId: h.placeId,
          placeName: h.placeName,
          lat: h.lat,
          lng: h.lng,
          intendedUse: h.intendedUse,
          harvestedAt: h.harvestedAt,
          notes: h.notes,
        }),
    });
  }

  const [adding, setAdding] = useState(false);
  const [plantPart, setPlantPart] = useState<string>();
  const [amount, setAmount] = useState('');
  const [amountUnit, setAmountUnit] = useState<string>();
  const [condition, setCondition] = useState<string>();
  const [location, setLocation] = useState<LocationValue>({});
  const [intendedUse, setIntendedUse] = useState<string[]>([]);
  const [harvestedAt, setHarvestedAt] = useState(today());
  const [notes, setNotes] = useState('');

  function reset() {
    setPlantPart(undefined);
    setAmount('');
    setAmountUnit(undefined);
    setCondition(undefined);
    setLocation({});
    setIntendedUse([]);
    setHarvestedAt(today());
    setNotes('');
    setAdding(false);
  }

  async function submit() {
    await create.mutateAsync({
      speciesId,
      plantPart,
      amount: amount ? +amount : undefined,
      amountUnit,
      condition,
      placeId: location.placeId,
      placeName: location.placeName,
      lat: location.lat,
      lng: location.lng,
      intendedUse,
      harvestedAt,
      notes,
    });
    reset();
  }

  return (
    <div className="space-y-4">
      {!adding && (
        <Button onClick={() => setAdding(true)}>
          <Plus /> Add harvest
        </Button>
      )}

      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">New harvest</h3>
              <Button variant="ghost" size="icon" onClick={reset}>
                <X />
              </Button>
            </div>

            <Field label="Plant part">
              <EnumSelect vocab="plant_part" value={plantPart} onChange={setPlantPart} allowCreate />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount" htmlFor="amount">
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <Field label="Unit">
                <EnumSelect vocab="amount_unit" value={amountUnit} onChange={setAmountUnit} allowCreate />
              </Field>
            </div>
            <Field label="Condition">
              <EnumSelect vocab="storage_form" value={condition} onChange={setCondition} allowCreate />
            </Field>
            <Field label="Location">
              <LocationPicker value={location} onChange={setLocation} />
            </Field>
            <Field label="Intended use">
              <MultiSelectChips vocab="preparation_method" value={intendedUse} onChange={setIntendedUse} placeholder="Add use" />
            </Field>
            <Field label="Date harvested" htmlFor="harvestedAt">
              <Input id="harvestedAt" type="date" value={harvestedAt} onChange={(e) => setHarvestedAt(e.target.value)} />
            </Field>
            <Field label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </Field>

            <Button onClick={submit} disabled={create.isPending}>
              {create.isPending ? 'Saving…' : 'Save harvest'}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading harvests…</p>
      ) : harvests.length === 0 && !adding ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No harvests logged yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {harvests.map((h) => {
            const amountText = h.amount != null
              ? `${h.amount}${h.amountUnit ? ' ' + labelFor('amount_unit', h.amountUnit) : ''}`
              : undefined;
            return (
              <Card key={h.id}>
                <CardContent className="flex gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {h.plantPart ? labelFor('plant_part', h.plantPart) : 'Harvest'}
                      </p>
                      {amountText && <Badge variant="secondary">{amountText}</Badge>}
                      {h.condition && <Badge variant="secondary">{labelFor('storage_form', h.condition)}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{h.harvestedAt?.slice(0, 10)}</p>
                    {h.intendedUse.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        For: {h.intendedUse.map((u) => labelFor('preparation_method', u)).join(', ')}
                      </p>
                    )}
                    {h.notes && <p className="mt-1 line-clamp-2 text-sm">{h.notes}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive-foreground/70"
                    onClick={() => removeHarvest(h)}
                  >
                    <Trash2 />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
