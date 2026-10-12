import { getClient, startClientSession } from "@/lib/auth";
import { becomePhotographer, registerClient } from "@/lib/clients";
import { listClientBookings } from "@/lib/studio";

export async function GET() {
  const client = await getClient();
  if (!client) return Response.json({ client: null });
  return Response.json({ client, bookings: await listClientBookings(client.id) });
}

// { action: "register", name, phone, email, password, photographer }
// { action: "photographer" } switches on QR events for the signed-in account.
export async function POST(req: Request) {
  const body = await req.json();
  if (body.action === "photographer") {
    const client = await getClient();
    if (!client) return Response.json({ error: "سجّل دخولك أولاً" }, { status: 401 });
    await becomePhotographer(client.id);
    return Response.json({ ok: true });
  }
  const name = String(body.name ?? "").trim().slice(0, 100);
  const phone = String(body.phone ?? "").trim();
  const password = String(body.password ?? "");
  const email = String(body.email ?? "").trim().slice(0, 120);
  if (!name || phone.replace(/\D/g, "").length < 9) {
    return Response.json({ error: "الاسم ورقم الجوال مطلوبان" }, { status: 400 });
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "البريد غير صحيح" }, { status: 400 });
  if (password.length < 6) return Response.json({ error: "كلمة السر 6 أحرف على الأقل" }, { status: 400 });
  const result = await registerClient({ name, phone, email, password, photographer: Boolean(body.photographer) });
  if ("error" in result) return Response.json({ error: result.error }, { status: 409 });
  await startClientSession(result);
  return Response.json({ ok: true, home: body.photographer ? "/admin" : "/account" });
}
