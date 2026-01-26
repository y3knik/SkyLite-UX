export default defineNuxtPlugin(async () => {
  console.log('[CapacitorConfig] Plugin initializing...');

  // @ts-ignore - Capacitor is added via script tag in Capacitor builds
  if (typeof window !== 'undefined' && 'Capacitor' in window) {
    console.log('[CapacitorConfig] Capacitor detected');

    try {
      // Dynamically import Capacitor plugins to avoid SSR issues
      const { Preferences } = await import('@capacitor/preferences');

      // Get server URL from preferences (no default - user must configure)
      const { value } = await Preferences.get({ key: 'serverUrl' });
      const serverUrl = value || null;

      console.log('[CapacitorConfig] Loaded server URL from preferences:', serverUrl);

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

      console.log('[Capacitor $fetch]', {
        originalUrl: url,
        serverUrl: currentServerUrl,
        isApiCall: typeof url === 'string' && url.startsWith('/api/')
      });

      // If no server URL configured, reject API calls
      if (!currentServerUrl && typeof url === 'string' && url.startsWith('/api/')) {
        console.error('[Capacitor] No server URL configured for API call:', url);
        return Promise.reject(new Error('Server URL not configured'));
      }

      // Prepend server URL if relative path (API calls start with /)
      if (currentServerUrl && typeof url === 'string' && url.startsWith('/')) {
        const fullUrl = currentServerUrl + url;
        console.log('[Capacitor $fetch] Rewriting URL:', url, '->', fullUrl);
        url = fullUrl;
      }

      return originalFetch(url, options).catch((error) => {
        console.error('[Capacitor $fetch] Request failed:', {
          url,
          error: {
            name: error.name,
            message: error.message,
            cause: error.cause,
            stack: error.stack
          }
        });
        throw error;
      });
    };

      console.log('[CapacitorConfig] $fetch override installed');

      if (serverUrl) {
        console.log(`[CapacitorConfig] Server URL configured: ${serverUrl}`);
      } else {
        console.log('[CapacitorConfig] No server URL configured. Please configure in Mobile Settings.');
      }
    } catch (error) {
      console.error('[Capacitor] Failed to initialize:', error);
      // Continue anyway - let the app load
    }
  }
});
