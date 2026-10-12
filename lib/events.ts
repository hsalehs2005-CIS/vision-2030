import { deleteEventFiles } from "./files";
import { store } from "./store";

// face-api descriptors: the same person is typically < 0.5 euclidean distance.
export const MATCH_THRESHOLD = 0.5;

export async function deleteEventEverywhere(eventId: string) {
  const urls = await store.deleteEvent(eventId);
  await deleteEventFiles(eventId, urls);
}

// Deletes events (photos + face data) whose retention period has passed.
export async function purgeExpired() {
  for (const id of await store.expiredEventIds()) await deleteEventEverywhere(id);
}
