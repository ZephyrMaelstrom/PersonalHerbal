import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { getStore } from '@/lib/storage';
import { ToastProvider } from '@/components/ui/toast';
import { loadSettings } from '@/lib/settings';
import { applyAppearance } from '@/lib/appearance';
import './styles/index.css';

// Apply theme/text-size before first paint to avoid a flash of the default theme.
applyAppearance(loadSettings());

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: false } },
});

// Open the local store, seed Gen 1 on a truly fresh (empty, never-seeded) install, then take
// an automatic restore point. Seeding runs in the background and refreshes queries when done.
async function init() {
  await getStore().ready();
  const { gen1AlreadySeeded, markGen1Seeded } = await import('@/features/seed/seed');
  if (!gen1AlreadySeeded()) {
    const empty = (await getStore().species.list()).length === 0;
    if (empty) {
      const { seedGen1 } = await import('@/features/seed/seed');
      await seedGen1();
      await queryClient.invalidateQueries();
    } else {
      markGen1Seeded(); // existing data — don't auto-seed; the Settings button can load it
    }
  }
  await getStore().snapshots.maybeAuto();
}
void init().catch(() => {});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
