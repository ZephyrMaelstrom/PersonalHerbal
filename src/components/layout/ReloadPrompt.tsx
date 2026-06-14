import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from '@/components/ui/toast';

/**
 * Registers the service worker and surfaces a toast when a new deploy is available,
 * so the user knows to refresh instead of the update applying silently.
 */
export function ReloadPrompt() {
  const { toast } = useToast();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (needRefresh) {
      toast({
        message: 'New version available',
        actionLabel: 'Refresh',
        onAction: () => updateServiceWorker(true),
      });
    }
  }, [needRefresh, toast, updateServiceWorker]);

  return null;
}
