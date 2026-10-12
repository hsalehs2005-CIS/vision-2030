import { managedEvent } from "@/lib/event-access";
import { deleteEventEverywhere } from "@/lib/events";
import { useBlob } from "@/lib/files";
import { store } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { event, error } = await managedEvent((await params).id);
  if (error) return error;
  return Response.json({
    ...event,
    photos: await store.listPhotos(event.id),
    uploadMode: useBlob ? "blob" : "local",
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { event, error } = await managedEvent((await params).id);
  if (error) return error;
  await deleteEventEverywhere(event.id);
  return Response.json({ ok: true });
}
