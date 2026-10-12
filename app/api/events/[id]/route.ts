import { isAdmin } from "@/lib/auth";
import { deleteEventEverywhere } from "@/lib/events";
import { useBlob } from "@/lib/files";
import { store } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const event = await store.getEvent(id);
  if (!event) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({
    ...event,
    photos: await store.listPhotos(id),
    uploadMode: useBlob ? "blob" : "local",
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  await deleteEventEverywhere((await params).id);
  return Response.json({ ok: true });
}
