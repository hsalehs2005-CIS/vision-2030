import { isAdmin } from "@/lib/auth";
import { deleteFiles } from "@/lib/files";
import { store } from "@/lib/store";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id, photoId } = await params;
  await deleteFiles(await store.deletePhoto(id, photoId));
  return Response.json({ ok: true });
}
