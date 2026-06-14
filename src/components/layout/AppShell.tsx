import type { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { CalendarDays, Home, Leaf, NotebookPen, Settings, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnline } from '@/lib/pwa';
import { ReloadPrompt } from '@/components/layout/ReloadPrompt';

const NAV = [
  { to: '/', label: 'Today', icon: Home, exact: true },
  { to: '/species', label: 'Species', icon: Leaf, exact: false },
  { to: '/journal', label: 'Journal', icon: NotebookPen, exact: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, exact: true },
  { to: '/settings', label: 'Settings', icon: Settings, exact: true },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const online = useOnline();

  return (
    <div className="mx-auto flex min-h-full max-w-screen-sm flex-col">
      <ReloadPrompt />
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <Leaf className="size-5 text-primary" />
        <span className="font-semibold tracking-tight">Verdant Codex</span>
        {!online && (
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <WifiOff className="size-3.5" /> Offline
          </span>
        )}
      </header>

      <main className="flex-1 px-4 py-4 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-screen-sm">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
