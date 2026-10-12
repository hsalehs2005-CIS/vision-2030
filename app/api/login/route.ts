import { getClient, getSession, login, logout } from "@/lib/auth";

export async function GET() {
  const [session, client] = await Promise.all([getSession(), getClient()]);
  return Response.json({
    session,
    client: client && { name: client.name, isPhotographer: client.isPhotographer, suspended: client.suspended },
  });
}

export async function POST(req: Request) {
  const { identifier, password } = await req.json();
  const who = await login(String(identifier ?? ""), String(password ?? ""));
  if (!who) return Response.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  if (who === "owner") return Response.json({ ok: true, home: "/admin" });
  const session = await getSession();
  return Response.json({ ok: true, home: session ? "/admin" : "/account" });
}

export async function DELETE() {
  await logout();
  return Response.json({ ok: true });
}
