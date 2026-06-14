import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { FlaskConical, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { FormulaForm } from '@/features/formulas/FormulaForm';
import { useCreateFormula, useFormulas } from '@/features/formulas/hooks';

export function FormulasScreen() {
  const { data: formulas = [], isLoading } = useFormulas();
  const create = useCreateFormula();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Formulas</h1>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus /> New formula
          </Button>
        )}
      </div>

      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">New formula</h3>
              <Button variant="ghost" size="icon" onClick={() => setAdding(false)}>
                <X />
              </Button>
            </div>
            <FormulaForm
              pending={create.isPending}
              onSubmit={(input) => create.mutate(input, { onSuccess: () => { setAdding(false); toast({ message: 'Formula saved' }); } })}
            />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : formulas.length === 0 && !adding ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <FlaskConical className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No formulas yet. Build one to scale batches and print labels.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {formulas.map((f) => (
            <Link key={f.id} to="/formulas/$formulaId" params={{ formulaId: f.id }}>
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="p-3.5">
                  <p className="font-medium">{f.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {f.ingredients.map((i) => `${i.name} (${i.parts})`).join(' · ')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
