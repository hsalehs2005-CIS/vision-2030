import { cookies } from "next/headers";
import { createHash } from "node:crypto";

const COOKIE = "admin_session";

function password() {
  return process.env.ADMIN_PASSWORD || "admin";
}

function token() {
  return createHash("sha256").update(`event-photos:${password()}`).digest("hex");
}

export async function isAdmin() {
  return (await cookies()).get(COOKIE)?.value === token();
}

export async function login(pw: string) {
  if (pw !== password()) return false;
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}
