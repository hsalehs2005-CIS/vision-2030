import { MATCH_THRESHOLD } from "@/lib/events";
import { store } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const event = await store.getEventBySlug((await params).slug);
  if (!event) return Response.json({ error: "not found" }, { status: 404 });

  const { descriptor, all } = await req.json();
  let photos;
  if (all && event.allowBrowseAll) {
    photos = await store.listPhotos(event.id);
  } else if (Array.isArray(descriptor) && descriptor.length === 128 && descriptor.every(Number.isFinite)) {
    photos = await store.match(event.id, descriptor, MATCH_THRESHOLD);
  } else {
    return Response.json({ error: "bad descriptor" }, { status: 400 });
  }

  // The descriptor is used for this request only and is not stored.
  return Response.json({
    photos: photos.map(({ faceCount: _, ...p }) => p),
  });
}
