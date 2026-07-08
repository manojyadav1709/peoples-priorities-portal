importScripts("https://unpkg.com/dexie@latest/dist/dexie.js");

const CACHE_NAME = "peoples-priorities-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/submit",
  "/comparison",
  "/settings",
  "/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell assets...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Clearing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-suggestions") {
    console.log("[Service Worker] Background Sync Triggered: sync-suggestions");
    event.waitUntil(syncPendingSuggestions());
  }
});

async function syncPendingSuggestions() {
  const db = new Dexie("CitizenSuggestionsDB");
  db.version(1).stores({
    CitizenSuggestions: "++id, citizen_ref, channel, sector, text_content, village_id, timestamp, sync_status"
  });

  try {
    const pendingItems = await db.CitizenSuggestions.where("sync_status")
      .equals("pending")
      .toArray();

    if (pendingItems.length === 0) {
      console.log("[Service Worker] No pending offline items to sync.");
      return;
    }

    console.log(`[Service Worker] Syncing ${pendingItems.length} pending suggestions...`);

    for (const item of pendingItems) {
      const formData = new FormData();
      formData.append("citizen_ref", item.citizen_ref);
      formData.append("channel", item.channel);
      formData.append("raw_text", item.text_content);
      formData.append("village_id", item.village_id);

      if (item.audio_blob) {
        formData.append("audio_file", item.audio_blob, "offline_voice.mp3");
      }
      if (item.photo_blob) {
        formData.append("photo_file", item.photo_blob, "offline_photo.jpg");
      }

      try {
        const response = await fetch("http://localhost:8000/api/submissions", {
          method: "POST",
          body: formData
        });

        const data = await response.json();
        if (response.status === 200 && data.status === "success") {
          await db.CitizenSuggestions.update(item.id, {
            sync_status: "synced"
          });
          console.log(`[Service Worker] Successfully synced suggestion ID: ${item.id}`);
        } else {
          console.warn(`[Service Worker] Failed to sync suggestion ID: ${item.id}. Server returned status: ${response.status}`);
        }
      } catch (err) {
        console.error(`[Service Worker] Network error while syncing item ID: ${item.id}`, err);
        throw err;
      }
    }

    const clientsList = await self.clients.matchAll();
    for (const client of clientsList) {
      client.postMessage({ type: "SYNC_COMPLETE", message: "Offline data successfully synchronized!" });
    }

  } catch (dbError) {
    console.error("[Service Worker] IndexedDB error during sync:", dbError);
  }
}
