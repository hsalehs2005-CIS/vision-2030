import { matchPhotos } from "@/lib/match";
import { getEventBySlug } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const event = await getEventBySlug((await params).slug);
  if (!event) return Response.json({ error: "not found" }, { status: 404 });

  const { descriptor, all } = await req.json();
  const photos =
    all && event.allowBrowseAll
      ? event.photos
      : Array.isArray(descriptor) && descriptor.length === 128
        ? matchPhotos(event, descriptor.map(Number))
        : null;
  if (!photos) return Response.json({ error: "bad descriptor" }, { status: 400 });

  // The descriptor is used for this request only and is not stored.
  return Response.json({
    photos: photos.map((p) => ({ id: p.id, width: p.width, height: p.height })),
    total: event.photos.length,
  });
}
