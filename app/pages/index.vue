<script setup lang="ts">
// @ts-ignore - Capacitor is added via script tag in Capacitor builds
const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

// Immediate redirect - don't wait for onMounted
if (isCapacitor) {
  // For Capacitor, check server URL and redirect
  const checkAndRedirect = async () => {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      const { value: serverUrl } = await Preferences.get({ key: 'serverUrl' });

      if (!serverUrl || serverUrl.trim() === '') {
        await navigateTo("/mobile-settings", { replace: true });
      } else {
        await navigateTo("/mealplanner", { replace: true });
      }
    } catch (error) {
      console.error('[Index] Error:', error);
      // On error, default to meal planner
      await navigateTo("/mealplanner", { replace: true });
    }
  };

  checkAndRedirect();
} else {
  // For web, just go to home
  navigateTo("/home", { replace: true });
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p class="text-muted">Loading...</p>
    </div>
  </div>
</template>
