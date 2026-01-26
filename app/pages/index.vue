<script setup lang="ts">
import { onMounted } from 'vue';

const router = useRouter();

// @ts-ignore - Capacitor is added via script tag in Capacitor builds
const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

let hasNavigated = false;

// Defensive navigation function - guarantees navigation happens
async function performNavigation() {
  if (hasNavigated) {
    console.log('[Index] Already navigated, skipping');
    return;
  }

  console.log('[Index] performNavigation called, isCapacitor:', isCapacitor);

  try {
    if (isCapacitor) {
      console.log('[Index] Capacitor detected, checking server URL');

      const { Preferences } = await import('@capacitor/preferences');
      const { value: serverUrl } = await Preferences.get({ key: 'serverUrl' });

      console.log('[Index] Server URL:', serverUrl ? 'configured' : 'not configured');

      if (!serverUrl || serverUrl.trim() === '') {
        console.log('[Index] No server URL, navigating to mobile-settings');
        hasNavigated = true;
        await router.replace('/mobile-settings');
      } else {
        console.log('[Index] Server URL exists, navigating to mealplanner');
        hasNavigated = true;
        await router.replace('/mealplanner');
      }
    } else {
      console.log('[Index] Web version, navigating to home');
      hasNavigated = true;
      await router.replace('/home');
    }

    console.log('[Index] Navigation completed successfully');
  } catch (error) {
    console.error('[Index] Navigation error:', error);

    // Fallback navigation - just go somewhere
    if (!hasNavigated) {
      console.log('[Index] Error fallback, attempting navigation to mealplanner');
      hasNavigated = true;

      try {
        await router.replace('/mealplanner');
      } catch (fallbackError) {
        console.error('[Index] Fallback navigation also failed:', fallbackError);
        // Last resort - force navigation via window.location
        window.location.href = '/mealplanner';
      }
    }
  }
}

// Set a timeout fallback - if navigation hasn't happened after 2 seconds, force it
const navigationTimeout = setTimeout(() => {
  if (!hasNavigated) {
    console.warn('[Index] Navigation timeout - forcing navigation to mealplanner');
    hasNavigated = true;
    window.location.href = isCapacitor ? '/mealplanner' : '/home';
  }
}, 2000);

// Perform navigation on mount
onMounted(async () => {
  console.log('[Index] Component mounted');
  await performNavigation();
  clearTimeout(navigationTimeout);
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p class="text-muted">Loading...</p>
      <p class="text-xs text-muted mt-2">Connecting to meal planner...</p>
    </div>
  </div>
</template>
