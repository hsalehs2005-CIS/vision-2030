// Two kinds of login: the studio owner (ADMIN_PASSWORD) and approved
// photographers (email + password). The session is a signed cookie.
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isApprovedPhotographer, verifyPhotographer } from "./studio";

const COOKIE = "studio_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export type Session = { role: "owner" } | { role: "photographer"; id: string; name: string };

function ownerPassword() {
  // Without ADMIN_PASSWORD the owner login is off in production (no default password).
  return process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? null : "admin");
}

function secret() {
  return process.env.SESSION_SECRET || `studio:${process.env.ADMIN_PASSWORD ?? "dev"}`;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

async function setSession(session: Session) {
  const payload = Buffer.from(JSON.stringify({ ...session, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const [payload, sig] = value.split(".");
  const expected = sign(payload ?? "");
  if (!sig || sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now()) return null;
    if (data.role === "owner") return { role: "owner" };
    // A photographer removed or rejected by the owner loses access immediately.
    if (data.role === "photographer" && (await isApprovedPhotographer(data.id))) {
      return { role: "photographer", id: data.id, name: data.name };
    }
  } catch {}
  return null;
}

export async function isOwner() {
  return (await getSession())?.role === "owner";
}

export async function loginOwner(password: string) {
  const expected = ownerPassword();
  if (!expected || password !== expected) return false;
  await setSession({ role: "owner" });
  return true;
}

export async function loginPhotographer(email: string, password: string) {
  const p = await verifyPhotographer(email, password);
  if (!p) return false;
  await setSession({ role: "photographer", id: p.id, name: p.name });
  return true;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}

// The event belongs to this session: the owner sees all, a photographer only theirs.
export function canManageEvent(session: Session | null, event: { photographerId: string | null }) {
  if (!session) return false;
  return session.role === "owner" || event.photographerId === session.id;
}
