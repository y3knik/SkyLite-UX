import { Preferences } from '@capacitor/preferences';

export default defineNuxtPlugin(async () => {
  // @ts-ignore - Capacitor is added via script tag in Capacitor builds
  if (typeof window !== 'undefined' && 'Capacitor' in window) {
    // Get server URL from preferences or use default
    const { value } = await Preferences.get({ key: 'serverUrl' });
    const serverUrl = value || 'http://192.168.1.100:3000'; // Default server URL - user should update this

    // Override $fetch to use server URL for API calls
    const originalFetch = globalThis.$fetch;
    // @ts-ignore
    globalThis.$fetch = (url: string, options?: any) => {
      // Prepend server URL if relative path (API calls start with /)
      if (typeof url === 'string' && url.startsWith('/')) {
        url = serverUrl + url;
      }
      return originalFetch(url, options);
    };

    console.log(`[Capacitor] Server URL configured: ${serverUrl}`);
  }
});
