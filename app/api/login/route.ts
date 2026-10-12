import { login, logout } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json();
  return (await login(String(password ?? "")))
    ? Response.json({ ok: true })
    : Response.json({ error: "كلمة السر غير صحيحة" }, { status: 401 });
}

export async function DELETE() {
  await logout();
  return Response.json({ ok: true });
}
