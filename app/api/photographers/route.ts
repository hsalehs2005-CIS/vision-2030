import { isOwner, myPhotographerRequest, rememberPhotographer } from "@/lib/auth";
import { listPhotographers, requestPhotographer } from "@/lib/studio";

export async function GET() {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(await listPhotographers());
}

// Public: a photographer asks to use the QR photo feature.
export async function POST(req: Request) {
  const body = await req.json();
  const field = (k: string, max: number) => String(body[k] ?? "").trim().slice(0, max);
  const input = {
    name: field("name", 100),
    phone: field("phone", 30),
    email: field("email", 120).toLowerCase(),
    studio: field("studio", 100),
    city: field("city", 60),
    message: field("message", 1000),
    password: String(body.password ?? ""),
  };
  if (!input.name || !input.phone || !/^\S+@\S+\.\S+$/.test(input.email)) {
    return Response.json({ error: "الاسم والجوال والبريد الإلكتروني مطلوبة" }, { status: 400 });
  }
  if (input.password.length < 6) {
    return Response.json({ error: "كلمة السر 6 أحرف على الأقل" }, { status: 400 });
  }
  const id = await requestPhotographer(input);
  if (!id) return Response.json({ error: "يوجد طلب مسجل بهذا البريد، سجّل دخولك من صفحة الدخول" }, { status: 409 });
  // Stay signed in here: once approved, the dashboard button just works.
  await rememberPhotographer(id, input.name);
  return Response.json({ ok: true, status: (await myPhotographerRequest())?.status ?? "pending" });
}
