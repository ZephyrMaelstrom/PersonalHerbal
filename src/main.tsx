import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { registerSW } from 'virtual:pwa-register';
import { router } from './router';
import { getStore } from '@/lib/storage';
import './styles/index.css';

// Auto-update the service worker so a fresh deploy is picked up on next launch.
registerSW({ immediate: true });

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: false } },
});

// Open the local store eagerly so the first query doesn't race initialization.
void getStore().ready();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
