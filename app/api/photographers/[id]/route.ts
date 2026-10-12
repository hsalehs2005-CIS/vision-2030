import { isOwner } from "@/lib/auth";
import { deleteEventFiles } from "@/lib/files";
import { store } from "@/lib/store";
import { approvePhotographer, deletePhotographer, rejectPhotographer, resetPhotographerPassword } from "@/lib/studio";

// action "approve", "reject", or "reset" (new password, returned once).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { action } = await req.json();
  if (action === "approve") {
    await approvePhotographer(id);
    return Response.json({ ok: true });
  }
  if (action === "reset") return Response.json({ password: await resetPhotographerPassword(id) });
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
