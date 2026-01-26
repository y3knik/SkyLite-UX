<script setup lang="ts">
import { onMounted, ref } from 'vue';

const errorMessage = ref<string | null>(null);

onMounted(async () => {
  try {
    // @ts-ignore - Capacitor is added via script tag in Capacitor builds
    const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

    if (isCapacitor) {
      // Dynamically import Capacitor plugins only when needed
      const { Preferences } = await import('@capacitor/preferences');

      // Check if server URL is configured
      const { value: serverUrl } = await Preferences.get({ key: 'serverUrl' });

      // Check if serverUrl is null, undefined, or empty string
      if (!serverUrl || serverUrl.trim() === '') {
        // First run - redirect to mobile settings for configuration
        await navigateTo("/mobile-settings", { replace: true });
      } else {
        // Server configured - proceed to meal planner
        await navigateTo("/mealplanner", { replace: true });
      }
    } else {
      // Web version - go to home
      await navigateTo("/home", { replace: true });
    }
  } catch (error) {
    console.error('Error during app initialization:', error);

    // Don't show scary technical errors - just navigate
    // Most errors here are from Nuxt meta file fetches which are non-critical
    // Just proceed to the appropriate page

    // Determine destination based on platform
    // @ts-ignore
    const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

    setTimeout(async () => {
      if (isCapacitor) {
        // Try to check if server URL exists, if not go to settings
        try {
          const { Preferences } = await import('@capacitor/preferences');
          const { value: serverUrl } = await Preferences.get({ key: 'serverUrl' });

          if (!serverUrl || serverUrl.trim() === '') {
            await navigateTo("/mobile-settings", { replace: true });
          } else {
            await navigateTo("/mealplanner", { replace: true });
          }
        } catch {
          // If preferences check fails, default to mealplanner
          await navigateTo("/mealplanner", { replace: true });
        }
      } else {
        await navigateTo("/home", { replace: true });
      }
    }, 100);
  }
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen p-6">
    <div class="text-center max-w-md">
      <div v-if="!errorMessage">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-muted">Loading SkyLite...</p>
      </div>

      <div v-else class="bg-red-50 border-2 border-red-400 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-alert-circle" class="h-6 w-6 text-red-600 mt-0.5" />
          <div class="text-left">
            <h3 class="font-semibold text-red-900 mb-1">Initialization Error</h3>
            <p class="text-sm text-red-800 mb-3">{{ errorMessage }}</p>
            <p class="text-xs text-red-700">Redirecting to settings...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
