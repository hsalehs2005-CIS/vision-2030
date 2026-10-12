"use client";
import { canvasToJpeg, detectAllFaces, fileToImage, resize } from "./face-client";

// Detect faces on this device, then upload the photo with its face descriptors.
export async function uploadPhoto(eventId: string, file: Blob) {
  const img = await fileToImage(file);
  const faces = await detectAllFaces(resize(img, 1600));
  const form = new FormData();
  form.set("full", await canvasToJpeg(resize(img, 3000), 0.9));
  form.set("thumb", await canvasToJpeg(resize(img, 800), 0.8));
  form.set("faces", JSON.stringify(faces));
  form.set("width", String(img.naturalWidth));
  form.set("height", String(img.naturalHeight));
  const res = await fetch(`/api/events/${eventId}/photos`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  return faces.length;
}
