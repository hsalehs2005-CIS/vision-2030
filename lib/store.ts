// Prototype storage: JSON files + images on local disk under ./data.
// Swap this module for S3/R2 + Postgres in production.
import { promises as fs } from "node:fs";
import path from "node:path";
import { customAlphabet, nanoid } from "nanoid";

const DATA_DIR = path.join(process.cwd(), "data");
const EVENTS_DIR = path.join(DATA_DIR, "events");
const PHOTOS_DIR = path.join(DATA_DIR, "photos");

const slugId = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 8);

export type Photo = {
  id: string;
  width: number;
  height: number;
  faces: number[][]; // 128-d face descriptors, never images of faces
  uploadedAt: string;
};

export type Event = {
  id: string;
  slug: string;
  name: string;
  date: string;
  createdAt: string;
  retentionDays: number;
  allowBrowseAll: boolean;
  photos: Photo[];
};

async function ensureDirs() {
  await fs.mkdir(EVENTS_DIR, { recursive: true });
  await fs.mkdir(PHOTOS_DIR, { recursive: true });
}

function eventFile(id: string) {
  if (!/^[\w-]+$/.test(id)) throw new Error("bad id");
  return path.join(EVENTS_DIR, `${id}.json`);
}

export async function listEvents(): Promise<Event[]> {
  await ensureDirs();
  const files = await fs.readdir(EVENTS_DIR);
  const events = await Promise.all(
    files.filter((f) => f.endsWith(".json")).map((f) => getEvent(f.slice(0, -5))),
  );
  return events
    .filter((e): e is Event => !!e)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEvent(id: string): Promise<Event | null> {
  try {
    return JSON.parse(await fs.readFile(eventFile(id), "utf8"));
  } catch {
    return null;
  }
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  return (await listEvents()).find((e) => e.slug === slug) ?? null;
}

async function saveEvent(event: Event) {
  await ensureDirs();
  const file = eventFile(event.id);
  await fs.writeFile(`${file}.tmp`, JSON.stringify(event));
  await fs.rename(`${file}.tmp`, file);
}

export async function createEvent(input: {
  name: string;
  date: string;
  retentionDays: number;
  allowBrowseAll: boolean;
}): Promise<Event> {
  const event: Event = {
    id: nanoid(12),
    slug: slugId(),
    createdAt: new Date().toISOString(),
    photos: [],
    ...input,
  };
  await saveEvent(event);
  return event;
}

// Serialize writes per event so parallel uploads don't drop photos.
const locks = new Map<string, Promise<unknown>>();
function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(key, next.catch(() => {}));
  return next;
}

export function photoPath(eventId: string, photoId: string, size: "full" | "thumb") {
  if (!/^[\w-]+$/.test(eventId) || !/^[\w-]+$/.test(photoId)) throw new Error("bad id");
  return path.join(PHOTOS_DIR, eventId, `${photoId}${size === "thumb" ? "_t" : ""}.jpg`);
}

export async function addPhoto(
  eventId: string,
  full: Buffer,
  thumb: Buffer,
  meta: Omit<Photo, "id" | "uploadedAt">,
): Promise<Photo> {
  const photo: Photo = { id: nanoid(16), uploadedAt: new Date().toISOString(), ...meta };
  await fs.mkdir(path.join(PHOTOS_DIR, eventId), { recursive: true });
  await fs.writeFile(photoPath(eventId, photo.id, "full"), full);
  await fs.writeFile(photoPath(eventId, photo.id, "thumb"), thumb);
  return withLock(eventId, async () => {
    const event = await getEvent(eventId);
    if (!event) throw new Error("event not found");
    event.photos.push(photo);
    await saveEvent(event);
    return photo;
  });
}

export async function deletePhoto(eventId: string, photoId: string) {
  await withLock(eventId, async () => {
    const event = await getEvent(eventId);
    if (!event) return;
    event.photos = event.photos.filter((p) => p.id !== photoId);
    await saveEvent(event);
  });
  await fs.rm(photoPath(eventId, photoId, "full"), { force: true });
  await fs.rm(photoPath(eventId, photoId, "thumb"), { force: true });
}

export async function deleteEvent(eventId: string) {
  await fs.rm(eventFile(eventId), { force: true });
  await fs.rm(path.join(PHOTOS_DIR, eventId), { recursive: true, force: true });
}

// Deletes events (photos + face data) whose retention period has passed.
export async function purgeExpired() {
  const now = Date.now();
  for (const e of await listEvents()) {
    const expires = new Date(e.date || e.createdAt).getTime() + e.retentionDays * 86_400_000;
    if (now > expires) await deleteEvent(e.id);
  }
}
