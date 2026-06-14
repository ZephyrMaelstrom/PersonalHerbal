import { useState } from 'react';
import { ChevronRight, FlaskConical, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/inputs/Field';
import { EnumSelect } from '@/components/inputs/EnumSelect';
import { useToast } from '@/components/ui/toast';
import { labelFor } from '@/lib/vocab';
import { PREP_STATE_ORDER } from '@/lib/vocab/prep-state';
import type { Preparation, PreparationInput } from '@/lib/storage';
import { addDays, templateFor } from './templates';
import { useHarvests } from '@/features/harvests/hooks';
import { useInventory, useUpdateInventory } from '@/features/inventory/hooks';
import {
  useCreatePreparation,
  useDeletePreparation,
  usePreparations,
  useUpdatePreparation,
} from './hooks';

const choiceCls = (active: boolean) =>
  `rounded-md border px-2.5 py-1 text-xs ${active ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground'}`;

const today = () => new Date().toISOString().slice(0, 10);

/** Which date field gets stamped when a preparation advances into a given state. */
const STATE_DATE_FIELD: Partial<Record<string, 'readyAt' | 'pressedAt' | 'bottledAt'>> = {
  ready: 'readyAt',
  pressed: 'pressedAt',
  bottled: 'bottledAt',
};

export function PreparationsTab({ speciesId }: { speciesId: string }) {
  const { data: preps = [], isLoading } = usePreparations(speciesId);
  const { data: harvests = [] } = useHarvests(speciesId);
  const { data: inventory = [] } = useInventory();
  const updateInventory = useUpdateInventory();
  const create = useCreatePreparation(speciesId);
  const update = useUpdatePreparation(speciesId);
  const del = useDeletePreparation(speciesId);
  const { toast } = useToast();

  const harvestLabel = (id?: string) => {
    const h = harvests.find((x) => x.id === id);
    return h ? `${h.plantPart ? labelFor('plant_part', h.plantPart) : 'harvest'} · ${h.harvestedAt?.slice(0, 10)}` : '';
  };

  function removePrep(p: Preparation) {
    del.mutate(p.id);
    toast({
      message: 'Preparation deleted',
      actionLabel: 'Undo',
      onAction: () =>
        create.mutate({
          speciesId,
          method: p.method,
          solvent: p.solvent,
          ratio: p.ratio,
          plantPart: p.plantPart,
          amount: p.amount,
          amountUnit: p.amountUnit,
          harvestId: p.harvestId,
          state: p.state,
          startedAt: p.startedAt,
          readyAt: p.readyAt,
          pressedAt: p.pressedAt,
          bottledAt: p.bottledAt,
          notes: p.notes,
        }),
    });
  }

  const [adding, setAdding] = useState(false);
  const [method, setMethod] = useState<string>();
  const [solvent, setSolvent] = useState<string>();
  const [ratio, setRatio] = useState('');
  const [plantPart, setPlantPart] = useState<string>();
  const [amount, setAmount] = useState('');
  const [amountUnit, setAmountUnit] = useState<string>();
  const [startedAt, setStartedAt] = useState(today());
  const [notes, setNotes] = useState('');
  const [harvestId, setHarvestId] = useState<string>();
  const [deductId, setDeductId] = useState<string>();

  function reset() {
    setMethod(undefined);
    setSolvent(undefined);
    setRatio('');
    setPlantPart(undefined);
    setAmount('');
    setAmountUnit(undefined);
    setStartedAt(today());
    setNotes('');
    setHarvestId(undefined);
    setDeductId(undefined);
    setAdding(false);
  }

  // Choosing a method pre-fills the solvent/ratio defaults (still editable afterward).
  function onMethodChange(code: string | undefined) {
    setMethod(code);
    const t = templateFor(code);
    if (t.solvent) setSolvent(t.solvent);
    if (t.ratio) setRatio(t.ratio);
  }

  async function submit() {
    if (!method) return;
    const t = templateFor(method);
    await create.mutateAsync({
      speciesId,
      method,
      solvent,
      ratio: ratio || undefined,
      plantPart,
      amount: amount ? +amount : undefined,
      amountUnit,
      harvestId,
      state: 'macerating',
      startedAt,
      readyAt: t.daysToReady ? addDays(startedAt, t.daysToReady) : undefined,
      notes,
    });
    // Optionally draw the amount used down from an inventory item.
    if (deductId && amount) {
      const item = inventory.find((i) => i.id === deductId);
      if (item) {
        const next = Math.max(0, Math.round((item.quantity - +amount) * 100) / 100);
        await updateInventory.mutateAsync({ id: item.id, patch: { quantity: next } });
      }
    }
    reset();
  }

  function advance(p: Preparation) {
    const idx = PREP_STATE_ORDER.indexOf(p.state);
    const next = PREP_STATE_ORDER[idx + 1];
    if (!next) return;
    const patch: Partial<PreparationInput> = { state: next };
    const dateField = STATE_DATE_FIELD[next];
    if (dateField && !p[dateField]) patch[dateField] = today();
    update.mutate({ id: p.id, patch });
  }

  return (
    <div className="space-y-4">
      {!adding && (
        <Button onClick={() => setAdding(true)}>
          <Plus /> New preparation
        </Button>
      )}

      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">New preparation</h3>
              <Button variant="ghost" size="icon" onClick={reset}>
                <X />
              </Button>
            </div>

            <Field label="Method" hint="Picking a method fills in typical solvent & ratio — adjust as needed.">
              <EnumSelect vocab="preparation_method" value={method} onChange={onMethodChange} allowCreate />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Solvent">
                <EnumSelect vocab="solvent" value={solvent} onChange={setSolvent} allowCreate />
              </Field>
              <Field label="Ratio" htmlFor="ratio">
                <Input id="ratio" value={ratio} onChange={(e) => setRatio(e.target.value)} placeholder="1:5" />
              </Field>
            </div>
            <Field label="Plant part">
              <EnumSelect vocab="plant_part" value={plantPart} onChange={setPlantPart} allowCreate />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount" htmlFor="prepAmount">
                <Input
                  id="prepAmount"
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
            <Field label="Date started" htmlFor="startedAt">
              <Input id="startedAt" type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
            </Field>
            {harvests.length > 0 && (
              <Field label="Source harvest" hint="Link this batch to the harvest lot it came from.">
                <div className="flex flex-wrap gap-1.5">
                  {harvests.map((h) => (
                    <button key={h.id} type="button" className={choiceCls(harvestId === h.id)} onClick={() => setHarvestId(harvestId === h.id ? undefined : h.id)}>
                      {harvestLabel(h.id)}
                    </button>
                  ))}
                </div>
              </Field>
            )}

            {inventory.length > 0 && (
              <Field label="Deduct from inventory" hint="Subtracts the amount above from the chosen stock item.">
                <div className="flex flex-wrap gap-1.5">
                  {inventory.map((i) => (
                    <button key={i.id} type="button" className={choiceCls(deductId === i.id)} onClick={() => setDeductId(deductId === i.id ? undefined : i.id)}>
                      {i.name} ({i.quantity}{i.unit ? ` ${labelFor('amount_unit', i.unit)}` : ''})
                    </button>
                  ))}
                </div>
              </Field>
            )}

            <Field label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </Field>

            <Button onClick={submit} disabled={create.isPending || !method}>
              {create.isPending ? 'Saving…' : 'Save preparation'}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading preparations…</p>
      ) : preps.length === 0 && !adding ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No preparations yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {preps.map((p) => {
            const idx = PREP_STATE_ORDER.indexOf(p.state);
            const next = PREP_STATE_ORDER[idx + 1];
            const duePress = p.state === 'macerating' && p.readyAt && p.readyAt <= today();
            const meta = [
              p.solvent && labelFor('solvent', p.solvent),
              p.ratio,
              p.plantPart && labelFor('plant_part', p.plantPart),
            ].filter(Boolean);
            return (
              <Card key={p.id}>
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-start gap-2">
                    <FlaskConical className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{labelFor('preparation_method', p.method)}</p>
                      {meta.length > 0 && <p className="text-sm text-muted-foreground">{meta.join(' · ')}</p>}
                      <p className="text-xs text-muted-foreground">
                        Started {p.startedAt?.slice(0, 10)}
                        {p.harvestId && harvestLabel(p.harvestId) ? ` · from ${harvestLabel(p.harvestId)}` : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive-foreground/70"
                      onClick={() => removePrep(p)}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={duePress ? 'warning' : 'secondary'}>{labelFor('prep_state', p.state)}</Badge>
                    {duePress && <span className="text-xs text-yellow-400">Ready to press ({p.readyAt})</span>}
                    {!duePress && p.state === 'macerating' && p.readyAt && (
                      <span className="text-xs text-muted-foreground">Ready ~{p.readyAt}</span>
                    )}
                    {next && (
                      <Button size="sm" variant="outline" className="ml-auto" onClick={() => advance(p)}>
                        Mark {labelFor('prep_state', next)} <ChevronRight />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
