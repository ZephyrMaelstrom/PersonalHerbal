import { Link } from '@tanstack/react-router';
import { Leaf, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BuildStamp } from '@/components/layout/BuildStamp';
import { useSpeciesList } from '@/features/species/hooks';

export function TodayScreen() {
  const { data: species = [], isLoading } = useSpeciesList();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const recent = species.slice(0, 5);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-3xl font-semibold text-primary">{isLoading ? '—' : species.length}</p>
            <p className="text-sm text-muted-foreground">species in your codex</p>
          </div>
          <Button asChild>
            <Link to="/species/new">
              <Plus /> Add species
            </Link>
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent</h2>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <Leaf className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No species yet. Add your first plant to begin.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recent.map((s) => (
              <Link key={s.id} to="/species/$speciesId" params={{ speciesId: s.id }}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="p-3.5">
                    <p className="font-medium italic">{s.scientificName}</p>
                    {s.commonNames.length > 0 && (
                      <p className="text-sm text-muted-foreground">{s.commonNames.join(', ')}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <BuildStamp />
    </div>
  );
}
