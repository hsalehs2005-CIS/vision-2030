import { isOwner } from "@/lib/auth";
import { deleteClient, resetPassword, setSuspended } from "@/lib/clients";
import { deleteEventFiles } from "@/lib/files";
import { store } from "@/lib/store";

// action "suspend", "resume", or "reset" (new password, returned once).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { action } = await req.json();
  if (action === "suspend" || action === "resume") {
    await setSuspended(id, action === "suspend");
    return Response.json({ ok: true });
  }
  if (action === "reset") return Response.json({ password: await resetPassword(id) });
  return Response.json({ error: "bad action" }, { status: 400 });
}

// Removes the account with its events, photos and face data.
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  for (const e of await store.listEvents(id)) {
    await deleteEventFiles(e.id, await store.deleteEvent(e.id));
  }
  await deleteClient(id);
  return Response.json({ ok: true });
}
