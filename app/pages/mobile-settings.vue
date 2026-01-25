<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Mobile Settings</h1>

    <div v-if="isCapacitor" class="space-y-6">
      <!-- First-run setup alert -->
      <div v-if="!serverUrl" class="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-alert-circle" class="h-6 w-6 text-yellow-600 mt-0.5" />
          <div>
            <h3 class="font-semibold text-yellow-900 mb-1">Server Configuration Required</h3>
            <p class="text-sm text-yellow-800">
              This is your first time launching SkyLite. Please enter your home server URL below to get started.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label class="block mb-2 text-sm font-medium">Server URL</label>
        <input
          v-model="serverUrl"
          type="text"
          placeholder="http://192.168.1.100:3000"
          class="border rounded px-3 py-2 w-full font-mono text-sm"
          :class="!serverUrl ? 'border-yellow-400 border-2' : ''"
        />
        <p class="text-xs text-gray-500 mt-1">
          Enter your SkyLite server's IP address and port. Find this by running 'ipconfig' (Windows) or 'ifconfig' (Linux/Mac) on your server.
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

      <div v-if="saveSuccess" class="bg-green-100 text-green-800 p-4 rounded">
        <p class="font-semibold mb-2">Settings saved successfully!</p>
        <button
          @click="$router.push('/home')"
          class="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
        >
          Continue to App
        </button>
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
    // Dynamically import Capacitor
    const { Preferences } = await import('@capacitor/preferences');

    // Load current server URL
    const { value } = await Preferences.get({ key: 'serverUrl' });
    serverUrl.value = value || '';
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

    // Dynamically import Capacitor
    const { Preferences } = await import('@capacitor/preferences');

    // Save to preferences
    await Preferences.set({ key: 'serverUrl', value: serverUrl.value });

    // Update global server URL for immediate effect (no restart needed)
    // @ts-ignore
    if (typeof window !== 'undefined') {
      window.__CAPACITOR_SERVER_URL__ = serverUrl.value;
    }

    saveSuccess.value = true;
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Failed to save settings';
  }
}
</script>
