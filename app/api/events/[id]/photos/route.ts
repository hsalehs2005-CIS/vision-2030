import { managedEvent } from "@/lib/event-access";
import { isBlobUrl, saveLocal } from "@/lib/files";
import { newPhotoId, store } from "@/lib/store";

function validFaces(faces: unknown): faces is number[][] {
  return (
    Array.isArray(faces) &&
    faces.every((f) => Array.isArray(f) && f.length === 128 && f.every((x) => Number.isFinite(x)))
  );
}

// Two modes: JSON with Vercel Blob URLs (browser already uploaded the images),
// or multipart with the image bytes for local development.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await managedEvent(id);
  if (error) return error;

  let photo;
  if (req.headers.get("content-type")?.includes("application/json")) {
    const body = await req.json();
    if (!isBlobUrl(body.fullUrl) || !isBlobUrl(body.thumbUrl)) {
      return Response.json({ error: "bad url" }, { status: 400 });
    }
    photo = { fullUrl: String(body.fullUrl), thumbUrl: String(body.thumbUrl), ...body };
  } else {
    const form = await req.formData();
    const full = form.get("full");
    const thumb = form.get("thumb");
    if (!(full instanceof Blob) || !(thumb instanceof Blob)) {
      return Response.json({ error: "missing image" }, { status: 400 });
    }
    const photoId = newPhotoId();
    const urls = await saveLocal(
      id,
      photoId,
      Buffer.from(await full.arrayBuffer()),
      Buffer.from(await thumb.arrayBuffer()),
    );
    photo = {
      ...urls,
      id: photoId,
      faces: JSON.parse(String(form.get("faces") ?? "[]")),
      width: form.get("width"),
      height: form.get("height"),
    };
  }

  if (!validFaces(photo.faces)) return Response.json({ error: "bad faces" }, { status: 400 });
  await store.addPhoto(id, {
    id: typeof photo.id === "string" && /^[\w-]{10,40}$/.test(photo.id) ? photo.id : newPhotoId(),
    width: Number(photo.width) || 0,
    height: Number(photo.height) || 0,
    faces: photo.faces,
    fullUrl: photo.fullUrl,
    thumbUrl: photo.thumbUrl,
  });
  return Response.json({ ok: true, faceCount: photo.faces.length });
}
