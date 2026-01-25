<script setup lang="ts">
import { Preferences } from '@capacitor/preferences';

// @ts-ignore - Capacitor is added via script tag in Capacitor builds
const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

if (isCapacitor) {
  // Check if server URL is configured
  const { value: serverUrl } = await Preferences.get({ key: 'serverUrl' });

  if (!serverUrl) {
    // First run - redirect to mobile settings for configuration
    await navigateTo("/mobile-settings");
  } else {
    // Server configured - proceed to home
    await navigateTo("/home");
  }
} else {
  // Web version - go to home
  await navigateTo("/home");
}
</script>

<template>
  <div>
    <p>Redirecting to home...</p>
  </div>
</template>
