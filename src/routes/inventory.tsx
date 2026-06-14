import { useState } from 'react';
import { Boxes, Minus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/inputs/Field';
import { EnumSelect } from '@/components/inputs/EnumSelect';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { labelFor } from '@/lib/vocab';
import type { InventoryItem, InventoryItemInput } from '@/lib/storage';
import { useCreateInventory, useDeleteInventory, useInventory, useUpdateInventory } from '@/features/inventory/hooks';

const KINDS: { code: InventoryItem['kind']; label: string }[] = [
  { code: 'herb', label: 'Herb' },
  { code: 'preparation', label: 'Preparation' },
  { code: 'other', label: 'Other' },
];

const empty: InventoryItemInput = { name: '', kind: 'herb', quantity: 0, unit: 'g', lowThreshold: undefined, notes: '' };

function isLow(i: InventoryItem): boolean {
  return i.lowThreshold != null && i.lowThreshold > 0 && i.quantity <= i.lowThreshold;
}

export function InventoryScreen() {
  const { data: items = [], isLoading } = useInventory();
  const create = useCreateInventory();
  const update = useUpdateInventory();
  const del = useDeleteInventory();
  const { toast } = useToast();

  const [editing, setEditing] = useState<InventoryItem | 'new' | null>(null);
  const [form, setForm] = useState<InventoryItemInput>(empty);

  function openNew() {
    setForm(empty);
    setEditing('new');
  }
  function openEdit(i: InventoryItem) {
    setForm({ name: i.name, kind: i.kind, quantity: i.quantity, unit: i.unit, lowThreshold: i.lowThreshold, notes: i.notes });
    setEditing(i);
  }
  const set = <K extends keyof InventoryItemInput>(k: K, v: InventoryItemInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  function save() {
    if (!form.name.trim()) return;
    const input = { ...form, name: form.name.trim() };
    if (editing === 'new') create.mutate(input, { onSuccess: () => setEditing(null) });
    else if (editing) update.mutate({ id: editing.id, patch: input }, { onSuccess: () => setEditing(null) });
  }

  function adjust(i: InventoryItem, delta: number) {
    update.mutate({ id: i.id, patch: { quantity: Math.max(0, Math.round((i.quantity + delta) * 100) / 100) } });
  }

  function remove(i: InventoryItem) {
    del.mutate(i.id);
    toast({
      message: 'Item deleted',
      actionLabel: 'Undo',
      onAction: () =>
        create.mutate({ name: i.name, kind: i.kind, quantity: i.quantity, unit: i.unit, lowThreshold: i.lowThreshold, notes: i.notes }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        {!editing && (
          <Button size="sm" onClick={openNew}>
            <Plus /> Add item
          </Button>
        )}
      </div>

      {editing && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{editing === 'new' ? 'New item' : 'Edit item'}</h3>
              <Button variant="ghost" size="icon" onClick={() => setEditing(null)}>
                <X />
              </Button>
            </div>
            <Field label="Name" htmlFor="iname">
              <Input id="iname" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Dried nettle leaf" />
            </Field>
            <Field label="Type">
              <div className="flex gap-2">
                {KINDS.map((k) => (
                  <button
                    key={k.code}
                    type="button"
                    onClick={() => set('kind', k.code)}
                    className={cn(
                      'rounded-md border px-3 py-1.5 text-sm',
                      form.kind === k.code ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground',
                    )}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity" htmlFor="iqty">
                <Input id="iqty" type="number" inputMode="decimal" value={form.quantity} onChange={(e) => set('quantity', +e.target.value)} />
              </Field>
              <Field label="Unit">
                <EnumSelect vocab="amount_unit" value={form.unit} onChange={(v) => set('unit', v)} allowCreate />
              </Field>
            </div>
            <Field label="Low-stock threshold" htmlFor="ilow" hint="Optional — flag when quantity drops to/under this.">
              <Input
                id="ilow"
                type="number"
                inputMode="decimal"
                value={form.lowThreshold ?? ''}
                onChange={(e) => set('lowThreshold', e.target.value ? +e.target.value : undefined)}
              />
            </Field>
            <Field label="Notes">
              <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
            </Field>
            <Button onClick={save} disabled={create.isPending || update.isPending}>
              Save
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 && !editing ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Boxes className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No inventory yet. Track dried herbs and finished preparations here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <Card key={i.id} className={cn(isLow(i) && 'border-yellow-500/40')}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{i.name}</p>
                    {isLow(i) && <Badge variant="warning">Low</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {KINDS.find((k) => k.code === i.kind)?.label} · {i.quantity}
                    {i.unit ? ` ${labelFor('amount_unit', i.unit)}` : ''}
                  </p>
                </div>
                <Button variant="outline" size="icon" onClick={() => adjust(i, -1)} aria-label="Decrease">
                  <Minus />
                </Button>
                <Button variant="outline" size="icon" onClick={() => adjust(i, 1)} aria-label="Increase">
                  <Plus />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(i)} aria-label="Edit">
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive-foreground/70" onClick={() => remove(i)} aria-label="Delete">
                  <Trash2 />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
