import { isOwner } from "@/lib/auth";
import { deleteEventFiles } from "@/lib/files";
import { store } from "@/lib/store";
import { approvePhotographer, deletePhotographer, rejectPhotographer } from "@/lib/studio";

// action "approve" (also resets the password) or "reject".
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { action } = await req.json();
  if (action === "approve") return Response.json({ password: await approvePhotographer(id) });
  if (action === "reject") {
    await rejectPhotographer(id);
    return Response.json({ ok: true });
  }
  return Response.json({ error: "bad action" }, { status: 400 });
}

// Removes the photographer with their events, photos and face data.
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  for (const e of await store.listEvents(id)) {
    await deleteEventFiles(e.id, await store.deleteEvent(e.id));
  }
  await deletePhotographer(id);
  return Response.json({ ok: true });
}
