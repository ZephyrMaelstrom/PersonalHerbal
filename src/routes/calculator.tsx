import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/inputs/Field';
import { cn } from '@/lib/utils';

const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n: number): string => (Number.isFinite(n) ? Math.round(n * 100) / 100 : 0).toLocaleString();

const WEIGHT: Record<string, number> = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
const VOLUME: Record<string, number> = { mL: 1, L: 1000, tsp: 4.92892, tbsp: 14.7868, cup: 236.588, 'fl oz': 29.5735 };

function UnitChoice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 text-xs transition-colors',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground',
      )}
    >
      {children}
    </button>
  );
}

function Converter({ title, table }: { title: string; table: Record<string, number> }) {
  const units = Object.keys(table);
  const [value, setValue] = useState('1');
  const [unit, setUnit] = useState(units[0]);
  const base = num(value) * table[unit];
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-medium">{title}</p>
        <div className="flex gap-2">
          <Input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="w-28" />
          <div className="flex flex-wrap items-center gap-1.5">
            {units.map((u) => (
              <UnitChoice key={u} active={u === unit} onClick={() => setUnit(u)}>
                {u}
              </UnitChoice>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {units
            .filter((u) => u !== unit)
            .map((u) => (
              <div key={u} className="flex justify-between">
                <span className="text-muted-foreground">{u}</span>
                <span>{fmt(base / table[u])}</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TinctureCalc() {
  const [weight, setWeight] = useState('100');
  const [ratio, setRatio] = useState('5');
  const menstruum = num(weight) * num(ratio);
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-medium">Tincture ratio (weight:volume)</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Herb weight (g)" htmlFor="tw">
            <Input id="tw" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </Field>
          <Field label="Ratio 1 :" htmlFor="tr">
            <Input id="tr" type="number" inputMode="decimal" value={ratio} onChange={(e) => setRatio(e.target.value)} />
          </Field>
        </div>
        <p className="text-sm">
          Menstruum needed: <span className="font-semibold text-primary">{fmt(menstruum)} mL</span>
          <span className="text-muted-foreground"> · total ≈ {fmt(menstruum + num(weight))} mL</span>
        </p>
      </CardContent>
    </Card>
  );
}

function DilutionCalc() {
  const [source, setSource] = useState('95');
  const [target, setTarget] = useState('50');
  const [final, setFinal] = useState('250');
  const s = num(source);
  const t = num(target);
  const f = num(final);
  const valid = s > 0 && t >= 0 && t <= s;
  const highProof = valid ? (f * t) / s : 0;
  const water = valid ? f - highProof : 0;
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-medium">Alcohol dilution</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Source %" htmlFor="ds">
            <Input id="ds" type="number" inputMode="decimal" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <Field label="Target %" htmlFor="dt">
            <Input id="dt" type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
          </Field>
          <Field label="Final mL" htmlFor="df">
            <Input id="df" type="number" inputMode="decimal" value={final} onChange={(e) => setFinal(e.target.value)} />
          </Field>
        </div>
        {valid ? (
          <p className="text-sm">
            Mix <span className="font-semibold text-primary">{fmt(highProof)} mL</span> of {fmt(s)}% with{' '}
            <span className="font-semibold text-primary">{fmt(water)} mL</span> water.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Target % must be between 0 and the source %.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function CalculatorScreen() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Calculator</h1>
      <TinctureCalc />
      <DilutionCalc />
      <Converter title="Weight" table={WEIGHT} />
      <Converter title="Volume" table={VOLUME} />
    </div>
  );
}
