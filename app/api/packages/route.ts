import { isOwner } from "@/lib/auth";
import { cleanPackage, createPackage, listPackages } from "@/lib/studio";

export async function GET(req: Request) {
  const all = new URL(req.url).searchParams.has("all") && (await isOwner());
  return Response.json(await listPackages(all));
}

export async function POST(req: Request) {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const pkg = cleanPackage(await req.json());
  if (!pkg) return Response.json({ error: "الاسم والسعر مطلوبان" }, { status: 400 });
  return Response.json({ id: await createPackage(pkg) });
}
