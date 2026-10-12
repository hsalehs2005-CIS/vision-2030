import { isAdmin } from "@/lib/auth";
import { createEvent, listEvents, purgeExpired } from "@/lib/store";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  await purgeExpired();
  const events = await listEvents();
  return Response.json(
    events.map(({ photos, ...e }) => ({ ...e, photoCount: photos.length })),
  );
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return Response.json({ error: "اسم الحفلة مطلوب" }, { status: 400 });
  const event = await createEvent({
    name,
    date: String(body.date ?? new Date().toISOString().slice(0, 10)),
    retentionDays: Math.min(365, Math.max(1, Number(body.retentionDays) || 30)),
    allowBrowseAll: Boolean(body.allowBrowseAll),
  });
  return Response.json(event);
}
