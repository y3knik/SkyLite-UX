<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(async () => {
  // @ts-ignore - Capacitor is added via script tag in Capacitor builds
  const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

  if (isCapacitor) {
    // Dynamically import Capacitor plugins only when needed
    const { Preferences } = await import('@capacitor/preferences');

    // Check if server URL is configured
    const { value: serverUrl } = await Preferences.get({ key: 'serverUrl' });

    if (!serverUrl) {
      // First run - redirect to mobile settings for configuration
      await navigateTo("/mobile-settings");
    } else {
      // Server configured - proceed to meal planner
      await navigateTo("/mealplanner");
    }
  } else {
    // Web version - go to home
    await navigateTo("/home");
  }
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading SkyLite...</p>
    </div>
  </div>
</template>
