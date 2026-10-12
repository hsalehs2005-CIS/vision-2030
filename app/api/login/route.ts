import { getClient, getSession, loginOwner, loginPhotographer, logout } from "@/lib/auth";

export async function GET() {
  const client = await getClient();
  return Response.json({ session: await getSession(), client: client && { name: client.name } });
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const ok = email
    ? await loginPhotographer(String(email).trim(), String(password ?? ""))
    : await loginOwner(String(password ?? ""));
  return ok
    ? Response.json({ ok: true, session: await getSession() })
    : Response.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
}

export async function DELETE() {
  await logout();
  return Response.json({ ok: true });
}
