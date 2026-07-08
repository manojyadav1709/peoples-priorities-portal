// Client-side Service Worker registration helper
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("[Service Worker] Registered successfully with scope:", registration.scope);

      // Listen for message broadcasts from Service Worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SYNC_COMPLETE") {
          console.log("[Service Worker Notification]", event.data.message);
          // Dispatch custom event to trigger UI refresh
          window.dispatchEvent(new CustomEvent("offlineSyncComplete", { detail: event.data.message }));
        }
      });

    } catch (err) {
      console.warn("[Service Worker] Registration failed:", err);
    }
  });
}

// Request background sync registration
export async function registerBackgroundSync() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ("sync" in registration) {
      // Register background sync event tag
      await registration.sync.register("sync-suggestions");
      console.log("[Service Worker] Registered sync tag: sync-suggestions");
      return true;
    } else {
      console.warn("[Service Worker] Background Sync API is not supported by this browser.");
      return false;
    }
  } catch (err) {
    console.error("[Service Worker] Failed to register background sync:", err);
    return false;
  }
}
