import type { Event } from "./store";

// face-api descriptors: same person is typically < 0.5 euclidean distance.
export const MATCH_THRESHOLD = 0.5;

function distance(a: number[], b: number[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

export function matchPhotos(event: Event, descriptor: number[]) {
  return event.photos
    .map((p) => ({
      photo: p,
      best: Math.min(...p.faces.map((f) => distance(f, descriptor)), Infinity),
    }))
    .filter((m) => m.best < MATCH_THRESHOLD)
    .sort((a, b) => a.best - b.best)
    .map((m) => m.photo);
}
