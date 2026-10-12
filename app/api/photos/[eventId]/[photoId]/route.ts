import { promises as fs } from "node:fs";
import { localPhotoPath } from "@/lib/files";

// Serves locally stored photos in development. In production photos live on Vercel Blob.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string; photoId: string }> },
) {
  const { eventId, photoId } = await params;
  const url = new URL(req.url);
  const size = url.searchParams.get("size") === "thumb" ? "thumb" : "full";
  try {
    const data = await fs.readFile(localPhotoPath(eventId, photoId, size));
    const headers: Record<string, string> = {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=86400",
    };
    if (url.searchParams.has("download")) {
      headers["Content-Disposition"] = `attachment; filename="photo-${photoId.slice(0, 6)}.jpg"`;
    }
    return new Response(new Uint8Array(data), { headers });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
