export default defineNuxtPlugin(async () => {
  // @ts-ignore - Capacitor is added via script tag in Capacitor builds
  if (typeof window !== 'undefined' && 'Capacitor' in window) {
    try {
      // Dynamically import Capacitor plugins to avoid SSR issues
      const { Preferences } = await import('@capacitor/preferences');

      // Get server URL from preferences (no default - user must configure)
      const { value } = await Preferences.get({ key: 'serverUrl' });
      const serverUrl = value || null;

    // Store serverUrl in window for access by other components
    // @ts-ignore
    window.__CAPACITOR_SERVER_URL__ = serverUrl;

    // Override $fetch to use server URL for API calls
    const originalFetch = globalThis.$fetch;
    // @ts-ignore
    globalThis.$fetch = (url: string, options?: any) => {
      // Get current server URL (may have been updated in mobile-settings)
      // @ts-ignore
      const currentServerUrl = window.__CAPACITOR_SERVER_URL__;

      // If no server URL configured, reject API calls
      if (!currentServerUrl && typeof url === 'string' && url.startsWith('/api/')) {
        console.warn('[Capacitor] No server URL configured. Please set it in Mobile Settings.');
        return Promise.reject(new Error('Server URL not configured'));
      }

      // Prepend server URL if relative path (API calls start with /)
      if (currentServerUrl && typeof url === 'string' && url.startsWith('/')) {
        url = currentServerUrl + url;
      }
      return originalFetch(url, options);
    };

      if (serverUrl) {
        console.log(`[Capacitor] Server URL configured: ${serverUrl}`);
      } else {
        console.log('[Capacitor] No server URL configured. Please configure in Mobile Settings.');
      }
    } catch (error) {
      console.error('[Capacitor] Failed to initialize:', error);
      // Continue anyway - let the app load
    }
  }
});
