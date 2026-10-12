import { managedEvent } from "@/lib/event-access";
import { deleteFiles } from "@/lib/files";
import { store } from "@/lib/store";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const { id, photoId } = await params;
  const { error } = await managedEvent(id);
  if (error) return error;
  await deleteFiles(await store.deletePhoto(id, photoId));
  return Response.json({ ok: true });
}
