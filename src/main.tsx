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

// Open the local store eagerly so the first query doesn't race initialization, then take an
// automatic on-device restore point (throttled + change-detected inside maybeAuto).
void getStore()
  .ready()
  .then(() => getStore().snapshots.maybeAuto())
  .catch(() => {});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
