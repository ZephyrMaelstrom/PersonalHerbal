import { Link } from '@tanstack/react-router';
import { Flame, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ACHIEVEMENTS, unlockedCodes } from '@/lib/achievements';
import { useSettings } from '@/features/settings/hooks';
import { useProgressStats } from '@/features/progress/hooks';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className="text-2xl font-semibold text-primary">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export function ProgressScreen() {
  const { data: settings } = useSettings();
  const stats = useProgressStats();
  const unlocked = new Set(unlockedCodes(stats));

  if (settings && !settings.gamification) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">Progress & achievements are turned off.</p>
            <Button asChild variant="outline">
              <Link to="/settings">Enable in Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Level</p>
              <p className="text-3xl font-semibold text-primary">{stats.level}</p>
            </div>
            <div className="flex items-center gap-1.5 text-right">
              <Flame className={cn('size-5', stats.streak > 0 ? 'text-orange-400' : 'text-muted-foreground')} />
              <div>
                <p className="text-2xl font-semibold">{stats.streak}</p>
                <p className="text-xs text-muted-foreground">day streak</p>
              </div>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(stats.levelProgress / stats.levelSpan) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.levelProgress}/{stats.levelSpan} to level {stats.level + 1} · {stats.points} pts total
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Species" value={stats.speciesCount} />
        <Stat label="Sightings" value={stats.sightingCount} />
        <Stat label="Harvests" value={stats.harvestCount} />
        <Stat label="Preparations" value={stats.prepCount} />
        <Stat label="Journal" value={stats.journalCount} />
        <Stat label="Places" value={stats.distinctPlaces} />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Achievements ({unlocked.size}/{ACHIEVEMENTS.length})
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.has(a.code);
            return (
              <Card key={a.code} className={cn(!got && 'opacity-60')}>
                <CardContent className="flex items-center gap-3 p-3">
                  <span className="text-2xl" aria-hidden>
                    {got ? a.emoji : <Lock className="size-5 text-muted-foreground" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
