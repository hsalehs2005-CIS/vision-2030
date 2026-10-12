"use client";
import { upload } from "@vercel/blob/client";
import { nanoid } from "nanoid";
import { canvasToJpeg, detectAllFaces, fileToImage, resize } from "./face-client";

export type UploadMode = "blob" | "local";

// Detect faces on this device, then upload the photo with its face descriptors.
export async function uploadPhoto(eventId: string, file: Blob, mode: UploadMode) {
  const img = await fileToImage(file);
  const faces = await detectAllFaces(resize(img, 1600));
  const full = await canvasToJpeg(resize(img, 3000), 0.9);
  const thumb = await canvasToJpeg(resize(img, 800), 0.8);
  const meta = { faces, width: img.naturalWidth, height: img.naturalHeight };

  let res: Response;
  if (mode === "blob") {
    const id = nanoid(16);
    const opts = { access: "public" as const, handleUploadUrl: "/api/blob-upload", contentType: "image/jpeg" };
    const [f, t] = await Promise.all([
      upload(`events/${eventId}/${id}.jpg`, full, opts),
      upload(`events/${eventId}/${id}_t.jpg`, thumb, opts),
    ]);
    res = await fetch(`/api/events/${eventId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, fullUrl: f.url, thumbUrl: t.url, ...meta }),
    });
  } else {
    const form = new FormData();
    form.set("full", full);
    form.set("thumb", thumb);
    form.set("faces", JSON.stringify(faces));
    form.set("width", String(meta.width));
    form.set("height", String(meta.height));
    res = await fetch(`/api/events/${eventId}/photos`, { method: "POST", body: form });
  }
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  return faces.length;
}

export function downloadUrl(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}download=1`;
}
