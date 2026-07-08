import Dexie from "dexie";

export const db = new Dexie("CitizenSuggestionsDB");

db.version(1).stores({
  CitizenSuggestions: "++id, citizen_ref, channel, sector, text_content, village_id, timestamp, sync_status"
});

export async function saveOfflineSuggestion({
  citizen_ref,
  channel,
  sector,
  text_content,
  village_id,
  audio_blob,
  photo_blob
}) {
  return await db.CitizenSuggestions.add({
    citizen_ref,
    channel,
    sector,
    text_content,
    village_id,
    audio_blob: audio_blob || null,
    photo_blob: photo_blob || null,
    timestamp: new Date().toISOString(),
    sync_status: "pending"
  });
}

export async function getPendingSuggestions() {
  return await db.CitizenSuggestions.where("sync_status")
    .equals("pending")
    .toArray();
}

export async function markAsSynced(id) {
  return await db.CitizenSuggestions.update(id, {
    sync_status: "synced"
  });
}
