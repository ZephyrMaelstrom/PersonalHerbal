import { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, FileDown, Printer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/inputs/Field';
import { EnumSelect } from '@/components/inputs/EnumSelect';
import { useToast } from '@/components/ui/toast';
import { labelFor } from '@/lib/vocab';
import { deliver, printHtml } from '@/lib/export/share';
import type { Formula } from '@/lib/storage';
import { FormulaForm } from '@/features/formulas/FormulaForm';
import { useCreateFormula, useDeleteFormula, useFormula, useUpdateFormula } from '@/features/formulas/hooks';

const fmt = (n: number) => (Math.round(n * 100) / 100).toLocaleString();

function scaled(formula: Formula, total: number) {
  const totalParts = formula.ingredients.reduce((s, i) => s + (i.parts || 0), 0) || 1;
  return formula.ingredients.map((i) => ({ name: i.name, amount: (i.parts / totalParts) * total, parts: i.parts }));
}

export function FormulaDetailScreen() {
  const { formulaId } = useParams({ strict: false }) as { formulaId: string };
  const navigate = useNavigate();
  const { data: formula, isLoading } = useFormula(formulaId);
  const update = useUpdateFormula(formulaId);
  const del = useDeleteFormula();
  const recreate = useCreateFormula();
  const { toast } = useToast();

  const [total, setTotal] = useState('100');
  const [unit, setUnit] = useState<string>('g');

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!formula) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Formula not found.</p>
        <Button asChild variant="outline">
          <Link to="/formulas">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </div>
    );
  }

  const totalNum = parseFloat(total) || 0;
  const rows = scaled(formula, totalNum);
  const unitLabel = unit ? labelFor('amount_unit', unit) : '';

  function labelText(): string {
    const lines = [formula!.name, new Date().toLocaleDateString(), ''];
    if (totalNum > 0) lines.push(`Batch: ${fmt(totalNum)} ${unitLabel}`, '');
    lines.push('Ingredients:');
    for (const r of rows) lines.push(`  • ${r.name}: ${totalNum > 0 ? `${fmt(r.amount)} ${unitLabel}` : `${r.parts} parts`}`);
    if (formula!.notes) lines.push('', formula!.notes);
    lines.push('', '— Verdant Codex');
    return lines.join('\n');
  }

  function labelHtml(): string {
    const items = rows
      .map((r) => `<li>${r.name}: <strong>${totalNum > 0 ? `${fmt(r.amount)} ${unitLabel}` : `${r.parts} parts`}</strong></li>`)
      .join('');
    return `<!doctype html><meta charset="utf-8"><title>${formula!.name}</title>
<div style="font-family:Georgia,serif;max-width:24rem;margin:1.5rem auto;padding:1rem;border:1px solid #ccc">
<h2 style="margin:0 0 .25rem">${formula!.name}</h2>
<p style="color:#555;margin:0 0 .75rem">${new Date().toLocaleDateString()}${totalNum > 0 ? ` · Batch ${fmt(totalNum)} ${unitLabel}` : ''}</p>
<ul style="padding-left:1.1rem;line-height:1.6">${items}</ul>
${formula!.notes ? `<p style="color:#444">${formula!.notes}</p>` : ''}
<p style="color:#888;font-size:.8rem;margin-top:1rem">Verdant Codex</p></div>`;
  }

  function remove() {
    const snapshot = formula!;
    del.mutate(snapshot.id, {
      onSuccess: () => {
        navigate({ to: '/formulas' });
        toast({
          message: 'Formula deleted',
          actionLabel: 'Undo',
          onAction: () => recreate.mutate({ name: snapshot.name, ingredients: snapshot.ingredients, notes: snapshot.notes }),
        });
      },
    });
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/formulas">
          <ArrowLeft /> Formulas
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">{formula.name}</h1>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Batch calculator</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total amount" htmlFor="bt">
              <Input id="bt" type="number" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} />
            </Field>
            <Field label="Unit">
              <EnumSelect vocab="amount_unit" value={unit} onChange={(v) => setUnit(v ?? 'g')} allowCreate />
            </Field>
          </div>
          <div className="space-y-1 text-sm">
            {rows.map((r, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">{r.name}</span>
                <span>{totalNum > 0 ? `${fmt(r.amount)} ${unitLabel}` : `${r.parts} parts`}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => deliver({ filename: `${formula.name}-label.txt`, mime: 'text/plain', content: labelText() })}>
              <FileDown /> Share label
            </Button>
            <Button variant="outline" size="sm" onClick={() => printHtml(labelHtml())}>
              <Printer /> Print label
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Edit formula</p>
          <FormulaForm
            initial={{ name: formula.name, ingredients: formula.ingredients, notes: formula.notes }}
            submitLabel="Save changes"
            pending={update.isPending}
            onSubmit={(input) => update.mutate(input, { onSuccess: () => toast({ message: 'Saved' }) })}
          />
        </CardContent>
      </Card>

      <Button variant="ghost" size="sm" className="text-destructive-foreground/80" onClick={remove}>
        <Trash2 /> Delete formula
      </Button>
    </div>
  );
}
