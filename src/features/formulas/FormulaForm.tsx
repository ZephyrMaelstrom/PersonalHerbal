import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/inputs/Field';
import type { FormulaIngredient, FormulaInput } from '@/lib/storage';

const blank: FormulaInput = { name: '', ingredients: [{ name: '', parts: 1 }], notes: '' };

export function FormulaForm({
  initial,
  submitLabel = 'Save formula',
  pending,
  onSubmit,
}: {
  initial?: FormulaInput;
  submitLabel?: string;
  pending?: boolean;
  onSubmit: (input: FormulaInput) => void;
}) {
  const [name, setName] = useState(initial?.name ?? blank.name);
  const [ingredients, setIngredients] = useState<FormulaIngredient[]>(initial?.ingredients ?? blank.ingredients);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const setIng = (i: number, patch: Partial<FormulaIngredient>) =>
    setIngredients((xs) => xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const canSubmit =
    name.trim().length > 0 && ingredients.some((i) => i.name.trim() && i.parts > 0) && !pending;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          name: name.trim(),
          notes,
          ingredients: ingredients.filter((i) => i.name.trim() && i.parts > 0).map((i) => ({ ...i, name: i.name.trim() })),
        });
      }}
    >
      <Field label="Formula name" htmlFor="fname">
        <Input id="fname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sleep blend" />
      </Field>

      <Field label="Ingredients (by parts)">
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={ing.name}
                onChange={(e) => setIng(i, { name: e.target.value })}
                placeholder="Herb"
                className="flex-1"
              />
              <Input
                type="number"
                inputMode="decimal"
                value={ing.parts}
                onChange={(e) => setIng(i, { parts: +e.target.value })}
                className="w-20"
                aria-label="Parts"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIngredients((xs) => xs.filter((_, idx) => idx !== i))}
              >
                <X />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setIngredients((xs) => [...xs, { name: '', parts: 1 }])}>
            <Plus /> Add ingredient
          </Button>
        </div>
      </Field>

      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field>

      <Button type="submit" disabled={!canSubmit}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
