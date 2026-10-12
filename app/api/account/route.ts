import { getClient, loginClient, logoutClient, startClientSession } from "@/lib/auth";
import { registerClient } from "@/lib/clients";
import { listClientBookings } from "@/lib/studio";

export async function GET() {
  const client = await getClient();
  if (!client) return Response.json({ client: null });
  return Response.json({ client, bookings: await listClientBookings(client.id) });
}

// { action: "login", phone, password } or { action: "register", name, phone, email, password }
export async function POST(req: Request) {
  const body = await req.json();
  const phone = String(body.phone ?? "").trim();
  const password = String(body.password ?? "");
  if (body.action === "register") {
    const name = String(body.name ?? "").trim().slice(0, 100);
    if (!name || phone.replace(/\D/g, "").length < 9) {
      return Response.json({ error: "الاسم ورقم الجوال مطلوبان" }, { status: 400 });
    }
    if (password.length < 6) return Response.json({ error: "كلمة السر 6 أحرف على الأقل" }, { status: 400 });
    const client = await registerClient({ name, phone, email: String(body.email ?? "").trim().slice(0, 120), password });
    if (!client) return Response.json({ error: "هذا الجوال مسجّل، سجّل دخولك" }, { status: 409 });
    await startClientSession(client);
    return Response.json({ ok: true });
  }
  return (await loginClient(phone, password))
    ? Response.json({ ok: true })
    : Response.json({ error: "رقم الجوال أو كلمة السر غير صحيحة" }, { status: 401 });
}

export async function DELETE() {
  await logoutClient();
  return Response.json({ ok: true });
}
