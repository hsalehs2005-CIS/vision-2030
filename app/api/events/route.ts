import { getSession } from "@/lib/auth";
import { purgeExpired } from "@/lib/events";
import { store } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  await purgeExpired();
  return Response.json(await store.listEvents(session.role === "photographer" ? session.id : undefined));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return Response.json({ error: "اسم الحفلة مطلوب" }, { status: 400 });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : new Date().toISOString().slice(0, 10);
  const event = await store.createEvent({
    name,
    date,
    retentionDays: Math.min(365, Math.max(1, Number(body.retentionDays) || 30)),
    allowBrowseAll: Boolean(body.allowBrowseAll),
    photographerId: session.role === "photographer" ? session.id : null,
  });
  return Response.json(event);
}
