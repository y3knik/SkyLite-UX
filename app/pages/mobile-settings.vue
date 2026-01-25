<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Mobile Settings</h1>

    <div v-if="isCapacitor" class="space-y-6">
      <div>
        <label class="block mb-2 text-sm font-medium">Server URL</label>
        <input
          v-model="serverUrl"
          type="text"
          placeholder="http://192.168.1.100:3000"
          class="border rounded px-3 py-2 w-full"
        />
        <p class="text-xs text-gray-500 mt-1">
          Enter your SkyLite server's IP address and port. Find this by running 'ipconfig' on your server.
        </p>
      </div>

      <div>
        <button
          @click="saveSettings"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Save Settings
        </button>
      </div>

      <div v-if="saveSuccess" class="bg-green-100 text-green-800 p-3 rounded">
        Settings saved! Please restart the app for changes to take effect.
      </div>

      <div v-if="saveError" class="bg-red-100 text-red-800 p-3 rounded">
        {{ saveError }}
      </div>

      <div class="border-t pt-6 mt-6">
        <h2 class="text-lg font-semibold mb-3">Network Status</h2>
        <div class="space-y-2 text-sm">
          <p>
            <span class="font-medium">Status:</span>
            <span :class="isOnline ? 'text-green-600' : 'text-red-600'">
              {{ isOnline ? 'Online' : 'Offline' }}
            </span>
          </p>
          <p>
            <span class="font-medium">Pending Syncs:</span> {{ pendingCount }}
          </p>
          <button
            v-if="isOnline && pendingCount > 0"
            @click="triggerSync"
            class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
          >
            Sync Now
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-gray-500">
      <p>This page is only available in the mobile app.</p>
      <p class="mt-2">Use the regular Settings page for web configuration.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Preferences } from '@capacitor/preferences';
import { useOfflineSync } from '~/composables/useOfflineSync';

const serverUrl = ref('');
const saveSuccess = ref(false);
const saveError = ref<string | null>(null);
// @ts-ignore - Capacitor is added via script tag in Capacitor builds
const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

// Get offline sync status
const { isOnline, pendingCount, triggerSync } = useOfflineSync();

onMounted(async () => {
  if (isCapacitor) {
    // Load current server URL
    const { value } = await Preferences.get({ key: 'serverUrl' });
    serverUrl.value = value || 'http://192.168.1.100:3000';
  }
});

async function saveSettings() {
  saveSuccess.value = false;
  saveError.value = null;

  try {
    // Validate URL format
    if (!serverUrl.value.startsWith('http://') && !serverUrl.value.startsWith('https://')) {
      throw new Error('URL must start with http:// or https://');
    }

    // Save to preferences
    await Preferences.set({ key: 'serverUrl', value: serverUrl.value });
    saveSuccess.value = true;

    // Clear success message after 5 seconds
    setTimeout(() => {
      saveSuccess.value = false;
    }, 5000);
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Failed to save settings';
  }
}
</script>
