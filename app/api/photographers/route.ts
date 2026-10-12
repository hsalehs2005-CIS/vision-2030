import { isOwner } from "@/lib/auth";
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
  };
  if (!input.name || !input.phone || !/^\S+@\S+\.\S+$/.test(input.email)) {
    return Response.json({ error: "الاسم والجوال والبريد الإلكتروني مطلوبة" }, { status: 400 });
  }
  const { duplicate } = await requestPhotographer(input);
  if (duplicate) return Response.json({ error: "يوجد طلب مسجل بهذا البريد" }, { status: 409 });
  return Response.json({ ok: true });
}
