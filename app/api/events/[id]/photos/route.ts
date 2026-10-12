import { isAdmin } from "@/lib/auth";
import { addPhoto, getEvent } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await getEvent(id))) return Response.json({ error: "not found" }, { status: 404 });

  const form = await req.formData();
  const full = form.get("full");
  const thumb = form.get("thumb");
  if (!(full instanceof Blob) || !(thumb instanceof Blob)) {
    return Response.json({ error: "missing image" }, { status: 400 });
  }
  const faces = JSON.parse(String(form.get("faces") ?? "[]")) as number[][];
  if (!Array.isArray(faces) || faces.some((f) => !Array.isArray(f) || f.length !== 128)) {
    return Response.json({ error: "bad faces" }, { status: 400 });
  }
  const photo = await addPhoto(
    id,
    Buffer.from(await full.arrayBuffer()),
    Buffer.from(await thumb.arrayBuffer()),
    { width: Number(form.get("width")) || 0, height: Number(form.get("height")) || 0, faces },
  );
  return Response.json({ id: photo.id, faceCount: faces.length });
}
