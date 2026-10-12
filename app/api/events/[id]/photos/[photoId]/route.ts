import { isAdmin } from "@/lib/auth";
import { deletePhoto } from "@/lib/store";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id, photoId } = await params;
  await deletePhoto(id, photoId);
  return Response.json({ ok: true });
}
