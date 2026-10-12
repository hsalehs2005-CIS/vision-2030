import { isAdmin } from "@/lib/auth";
import { deleteEvent, getEvent } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const event = await getEvent((await params).id);
  if (!event) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({
    ...event,
    photos: event.photos.map(({ faces, ...p }) => ({ ...p, faceCount: faces.length })),
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  await deleteEvent((await params).id);
  return Response.json({ ok: true });
}
