<script setup lang="ts">
import { onMounted } from 'vue';

const router = useRouter();

// Define page meta to prevent caching
definePageMeta({
  keepalive: false,
});

onMounted(async () => {
  console.log('[Index] Mounted, determining destination...');

  try {
    // @ts-ignore - Capacitor is added via script tag in Capacitor builds
    const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

    if (isCapacitor) {
      console.log('[Index] Capacitor detected');

      // Dynamically import Capacitor plugins only when needed
      const { Preferences } = await import('@capacitor/preferences');

      // Check if server URL is configured
      const { value: serverUrl } = await Preferences.get({ key: 'serverUrl' });
      console.log('[Index] Server URL:', serverUrl ? 'configured' : 'not configured');

      // Check if serverUrl is null, undefined, or empty string
      if (!serverUrl || serverUrl.trim() === '') {
        console.log('[Index] Redirecting to mobile-settings');
        router.replace('/mobile-settings');
      } else {
        console.log('[Index] Redirecting to mealplanner');
        router.replace('/mealplanner');
      }
    } else {
      console.log('[Index] Web version, redirecting to home');
      router.replace('/home');
    }
  } catch (error) {
    console.error('[Index] Error during initialization:', error);

    // On error, try to determine destination anyway
    // @ts-ignore
    const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

    if (isCapacitor) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const { value: serverUrl } = await Preferences.get({ key: 'serverUrl' });

        if (!serverUrl || serverUrl.trim() === '') {
          console.log('[Index] Error recovery: Redirecting to mobile-settings');
          router.replace('/mobile-settings');
        } else {
          console.log('[Index] Error recovery: Redirecting to mealplanner');
          router.replace('/mealplanner');
        }
      } catch {
        // Last resort - just go to meal planner
        console.log('[Index] Last resort: Redirecting to mealplanner');
        router.replace('/mealplanner');
      }
    } else {
      console.log('[Index] Error recovery: Redirecting to home');
      router.replace('/home');
    }
  }
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen p-6">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p class="text-muted">Loading SkyLite...</p>
    </div>
  </div>
</template>
