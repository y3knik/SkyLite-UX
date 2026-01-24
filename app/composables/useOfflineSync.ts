import { ref, computed } from 'vue';
import {
  getPendingMeals,
  removePendingMeal,
  updatePendingMealStatus,
} from '~/utils/offlineDb';

export function useOfflineSync() {
  const isOnline = ref(navigator.onLine);
  const isSyncing = ref(false);
  const pendingCount = ref(0);
  const lastSyncTime = ref<Date | null>(null);
  const syncError = ref<string | null>(null);

  // Update online status
  if (process.client) {
    window.addEventListener('online', () => {
      isOnline.value = true;
      triggerSync();
    });

    window.addEventListener('offline', () => {
      isOnline.value = false;
    });
  }

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

  // Initialize
  if (process.client) {
    updatePendingCount();

    // Auto-sync periodically when online
    setInterval(() => {
      if (isOnline.value && pendingCount.value > 0) {
        triggerSync();
      }
    }, 30000);
  }

  return {
    isOnline: computed(() => isOnline.value),
    isSyncing: computed(() => isSyncing.value),
    pendingCount: computed(() => pendingCount.value),
    lastSyncTime: computed(() => lastSyncTime.value),
    syncError: computed(() => syncError.value),
    triggerSync,
    updatePendingCount,
  };
}
