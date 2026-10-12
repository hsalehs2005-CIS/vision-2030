import { getClient, isOwner } from "@/lib/auth";
import { bookedDates, createBooking, listBookings } from "@/lib/studio";

export async function GET() {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(await listBookings());
}

// A signed-in client requests a session. It stays "pending" until the owner confirms it.
export async function POST(req: Request) {
  const client = await getClient();
  if (!client) return Response.json({ error: "سجّل دخولك أولاً" }, { status: 401 });
  const body = await req.json();
  const date = String(body.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "اختر التاريخ" }, { status: 400 });
  }
  if (date < new Date().toISOString().slice(0, 10)) {
    return Response.json({ error: "اختر تاريخاً قادماً" }, { status: 400 });
  }
  if ((await bookedDates()).includes(date)) {
    return Response.json({ error: "هذا اليوم محجوز، اختر يوماً آخر" }, { status: 409 });
  }
  await createBooking({
    name: client.name,
    phone: client.phone,
    email: client.email,
    clientId: client.id,
    packageId: body.packageId ? String(body.packageId) : null,
    date,
    time: String(body.time ?? "").slice(0, 10),
    notes: String(body.notes ?? "").trim().slice(0, 1000),
  });
  return Response.json({ ok: true });
}
