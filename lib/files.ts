// Image files: Vercel Blob in production (browser uploads directly, so large
// photos skip the server's request size limit), local disk in development.
import { del } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";

export const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

const PHOTOS_DIR = path.join(process.cwd(), "data", "photos");
const LOCAL_PREFIX = "/api/photos/";

export function localPhotoPath(eventId: string, photoId: string, size: "full" | "thumb") {
  if (!/^[\w-]+$/.test(eventId) || !/^[\w-]+$/.test(photoId)) throw new Error("bad id");
  return path.join(PHOTOS_DIR, eventId, `${photoId}${size === "thumb" ? "_t" : ""}.jpg`);
}

export async function saveLocal(eventId: string, photoId: string, full: Buffer, thumb: Buffer) {
  await fs.mkdir(path.join(PHOTOS_DIR, eventId), { recursive: true });
  await fs.writeFile(localPhotoPath(eventId, photoId, "full"), full);
  await fs.writeFile(localPhotoPath(eventId, photoId, "thumb"), thumb);
  const base = `${LOCAL_PREFIX}${eventId}/${photoId}`;
  return { fullUrl: base, thumbUrl: `${base}?size=thumb` };
}

export function isBlobUrl(url: string) {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function deleteFiles(urls: string[]) {
  const blobs = urls.filter(isBlobUrl);
  if (blobs.length) await del(blobs);
  for (const url of urls.filter((u) => u.startsWith(LOCAL_PREFIX))) {
    const [eventId, rest] = url.slice(LOCAL_PREFIX.length).split("/");
    const photoId = rest.split("?")[0];
    await fs.rm(localPhotoPath(eventId, photoId, url.includes("size=thumb") ? "thumb" : "full"), {
      force: true,
    });
  }
}

export async function deleteEventFiles(eventId: string, urls: string[]) {
  await deleteFiles(urls.filter(isBlobUrl));
  if (!useBlob && /^[\w-]+$/.test(eventId)) {
    await fs.rm(path.join(PHOTOS_DIR, eventId), { recursive: true, force: true });
  }
}
