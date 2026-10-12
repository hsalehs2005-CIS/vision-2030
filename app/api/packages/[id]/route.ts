import { isOwner } from "@/lib/auth";
import { cleanPackage, deletePackage, updatePackage } from "@/lib/studio";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const pkg = cleanPackage(await req.json());
  if (!pkg) return Response.json({ error: "الاسم والسعر مطلوبان" }, { status: 400 });
  await updatePackage((await params).id, pkg);
  return Response.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  await deletePackage((await params).id);
  return Response.json({ ok: true });
}
