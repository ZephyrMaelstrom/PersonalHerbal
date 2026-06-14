import { Link } from '@tanstack/react-router';
import { Boxes, Calculator, FlaskConical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const TOOLS = [
  { to: '/calculator', label: 'Calculator', desc: 'Tincture ratios, alcohol dilution, conversions', icon: Calculator },
  { to: '/formulas', label: 'Formulas', desc: 'Build & scale blends, print labels', icon: FlaskConical },
  { to: '/inventory', label: 'Inventory', desc: 'Track herbs & preparations, low-stock flags', icon: Boxes },
] as const;

export function WorkbenchScreen() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Workbench</h1>
      <div className="space-y-2">
        {TOOLS.map(({ to, label, desc, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-center gap-3 p-4">
                <Icon className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
