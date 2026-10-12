import { isOwner } from "@/lib/auth";
import { listPhotographers } from "@/lib/clients";

export async function GET() {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(await listPhotographers());
}
