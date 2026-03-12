import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { syncPendingPhotos, fetchSharedPhotos } from './sync';

/**
 * Custom hook to manage background syncing
 * - Syncs when app launches
 * - Syncs periodically every 30 seconds
 * - Syncs when app comes to foreground
 */
export const useSyncService = () => {
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // Initial sync when app loads
    console.log('[UseSyncService] App initialized, triggering initial sync');
    syncPendingPhotos();
    fetchSharedPhotos();

    // Set up app state listener (foreground/background)
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up periodic sync (every 30 seconds)
    syncIntervalRef.current = setInterval(() => {
      console.log('[UseSyncService] Periodic sync tick');
      syncPendingPhotos().catch(e => console.error('Sync error:', e));
      fetchSharedPhotos().catch(e => console.error('Fetch error:', e));
    }, 30000); // 30 seconds

    return () => {
      // Cleanup
      appStateSubscription.remove();
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  const handleAppStateChange = (state: AppStateStatus) => {
    if (appStateRef.current !== state) {
      if (state === 'active') {
        // App came to foreground
        console.log('[UseSyncService] App came to foreground, syncing...');
        syncPendingPhotos().catch(e => console.error('Sync error:', e));
        fetchSharedPhotos().catch(e => console.error('Fetch error:', e));
      }
      appStateRef.current = state;
    }
  };
};
