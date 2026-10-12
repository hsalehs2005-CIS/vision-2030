// Local development store: JSON files under ./data. Used when DATABASE_URL is not set.
import { promises as fs } from "node:fs";
import path from "node:path";
import type { EventMeta, NewEvent, NewPhoto, PhotoInfo, Store } from "./types";
import { newEventIds } from "./ids";

const EVENTS_DIR = path.join(process.cwd(), "data", "events");

type StoredPhoto = Omit<NewPhoto, "id"> & { id: string; uploadedAt: string };
type StoredEvent = EventMeta & { photos: StoredPhoto[] };

function eventFile(id: string) {
  if (!/^[\w-]+$/.test(id)) throw new Error("bad id");
  return path.join(EVENTS_DIR, `${id}.json`);
}

async function read(id: string): Promise<StoredEvent | null> {
  try {
    return JSON.parse(await fs.readFile(eventFile(id), "utf8"));
  } catch {
    return null;
  }
}

async function write(event: StoredEvent) {
  await fs.mkdir(EVENTS_DIR, { recursive: true });
  const file = eventFile(event.id);
  await fs.writeFile(`${file}.tmp`, JSON.stringify(event));
  await fs.rename(`${file}.tmp`, file);
}

async function readAll(): Promise<StoredEvent[]> {
  await fs.mkdir(EVENTS_DIR, { recursive: true });
  const files = (await fs.readdir(EVENTS_DIR)).filter((f) => f.endsWith(".json"));
  const events = await Promise.all(files.map((f) => read(f.slice(0, -5))));
  return events.filter((e): e is StoredEvent => !!e);
}

// Serialize writes per event so parallel uploads don't drop photos.
const locks = new Map<string, Promise<unknown>>();
function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const next = (locks.get(key) ?? Promise.resolve()).then(fn, fn);
  locks.set(key, next.catch(() => {}));
  return next;
}

function meta({ photos: _, ...e }: StoredEvent): EventMeta {
  return e;
}

function info({ faces, ...p }: StoredPhoto): PhotoInfo {
  return { ...p, faceCount: faces.length };
}

function distance(a: number[], b: number[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

export const localStore: Store = {
  async listEvents() {
    return (await readAll())
      .map((e) => ({ ...meta(e), photoCount: e.photos.length }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getEvent(id) {
    const e = await read(id);
    return e && meta(e);
  },

  async getEventBySlug(slug) {
    const e = (await readAll()).find((e) => e.slug === slug);
    return e ? meta(e) : null;
  },

  async listPhotos(eventId) {
    return ((await read(eventId))?.photos ?? []).map(info);
  },

  async createEvent(input: NewEvent) {
    const event: StoredEvent = {
      ...newEventIds(),
      createdAt: new Date().toISOString(),
      photos: [],
      ...input,
    };
    await write(event);
    return meta(event);
  },

  async addPhoto(eventId, photo) {
    await withLock(eventId, async () => {
      const event = await read(eventId);
      if (!event) throw new Error("event not found");
      event.photos.push({ ...photo, uploadedAt: new Date().toISOString() });
      await write(event);
    });
  },

  async deletePhoto(eventId, photoId) {
    return withLock(eventId, async () => {
      const event = await read(eventId);
      const photo = event?.photos.find((p) => p.id === photoId);
      if (!event || !photo) return [];
      event.photos = event.photos.filter((p) => p.id !== photoId);
      await write(event);
      return [photo.fullUrl, photo.thumbUrl];
    });
  },

  async deleteEvent(eventId) {
    const event = await read(eventId);
    await fs.rm(eventFile(eventId), { force: true });
    return event?.photos.flatMap((p) => [p.fullUrl, p.thumbUrl]) ?? [];
  },

  async match(eventId, descriptor, threshold) {
    const photos = (await read(eventId))?.photos ?? [];
    return photos
      .filter((p) => p.faces.some((f) => distance(f, descriptor) < threshold))
      .map(info);
  },

  async expiredEventIds() {
    const now = Date.now();
    return (await readAll())
      .filter((e) => now > new Date(e.date || e.createdAt).getTime() + e.retentionDays * 86_400_000)
      .map((e) => e.id);
  },
};
