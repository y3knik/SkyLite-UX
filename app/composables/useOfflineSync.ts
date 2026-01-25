import { ref, readonly, onMounted, onUnmounted } from 'vue';
import { Network } from '@capacitor/network';
import {
  getPendingMeals,
  removePendingMeal,
  updatePendingMealStatus,
} from '~/utils/offlineDB';

export function useOfflineSync() {
  const isOnline = ref(false);
  const isSyncing = ref(false);
  const pendingCount = ref(0);
  const lastSyncTime = ref<Date | null>(null);
  const syncError = ref<string | null>(null);

  let syncInterval: NodeJS.Timeout | null = null;
  // @ts-ignore - Capacitor is added via script tag in Capacitor builds
  const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

  // Load pending count
  async function updatePendingCount() {
    const pending = await getPendingMeals();
    pendingCount.value = pending.length;
  }

  // Sync pending meals to server
  async function syncPendingMeals() {
    if (!isOnline.value || isSyncing.value) return;

    isSyncing.value = true;
    syncError.value = null;

    try {
      const pending = await getPendingMeals();

      for (const item of pending) {
        try {
          await updatePendingMealStatus(item.id, 'syncing');

          await $fetch(`/api/meal-plans/${item.mealPlanId}/meals`, {
            method: 'POST',
            body: item.mealData,
          });

          await removePendingMeal(item.id);
        } catch (error) {
          await updatePendingMealStatus(
            item.id,
            'error',
            error instanceof Error ? error.message : 'Sync failed'
          );
        }
      }

      lastSyncTime.value = new Date();
      await updatePendingCount();
      await refreshNuxtData('meal-plans');
    } catch (error) {
      syncError.value = error instanceof Error ? error.message : 'Sync failed';
    } finally {
      isSyncing.value = false;
    }
  }

  async function triggerSync() {
    if (isOnline.value) {
      await syncPendingMeals();
    }
  }

  // Event handlers for cleanup (web only)
  const onOnlineHandler = () => {
    isOnline.value = true;
    triggerSync();
  };

  const onOfflineHandler = () => {
    isOnline.value = false;
  };

  // Capacitor Network listener
  const onNetworkChange = (status: any) => {
    isOnline.value = status.connected;
    if (status.connected) {
      triggerSync();
    }
  };

  // Initialize on client
  onMounted(async () => {
    if (isCapacitor) {
      // Use Capacitor Network API
      const status = await Network.getStatus();
      isOnline.value = status.connected;

      // Add event listener for network changes
      Network.addListener('networkStatusChange', onNetworkChange);
    } else {
      // Use browser API
      isOnline.value = navigator.onLine;

      // Add event listeners
      window.addEventListener('online', onOnlineHandler);
      window.addEventListener('offline', onOfflineHandler);
    }

    // Load pending count
    await updatePendingCount();

    // Auto-sync periodically when online
    syncInterval = setInterval(() => {
      if (isOnline.value && pendingCount.value > 0) {
        triggerSync();
      }
    }, 30000);
  });

  // Cleanup on unmount
  onUnmounted(async () => {
    if (isCapacitor) {
      // Remove Capacitor Network listeners
      await Network.removeAllListeners();
    } else {
      // Remove browser event listeners
      window.removeEventListener('online', onOnlineHandler);
      window.removeEventListener('offline', onOfflineHandler);
    }

    if (syncInterval) {
      clearInterval(syncInterval);
    }
  });

  return {
    isOnline: readonly(isOnline),
    isSyncing: readonly(isSyncing),
    pendingCount: readonly(pendingCount),
    lastSyncTime: readonly(lastSyncTime),
    syncError: readonly(syncError),
    triggerSync,
    updatePendingCount,
  };
}
