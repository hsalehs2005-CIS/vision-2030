// One sign-in for everyone. Accounts (clients and photographers) sign in with
// phone or email; the studio owner signs in on the same form as "admin" with
// ADMIN_PASSWORD. Each kind has its own signed cookie.
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { findClient, verifyClient } from "./clients";

const OWNER_COOKIE = "studio_session";
const ACCOUNT_COOKIE = "client_session";
const MAX_AGE = 60 * 60 * 24 * 30;

// Who may manage events: the owner (all events) or a photographer account (its own).
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

async function writeCookie(name: string, data: object) {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  (await cookies()).set(name, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

async function readSigned<T>(name: string): Promise<T | null> {
  const value = (await cookies()).get(name)?.value;
  if (!value) return null;
  const [payload, sig] = value.split(".");
  const expected = sign(payload ?? "");
  if (!sig || sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp < Date.now() ? null : data;
  } catch {
    return null;
  }
}

// The signed-in account (client or photographer), if any.
export async function getClient() {
  const data = await readSigned<{ id: string }>(ACCOUNT_COOKIE);
  return data ? findClient(data.id) : null;
}

export async function getSession(): Promise<Session | null> {
  if ((await readSigned<{ role: string }>(OWNER_COOKIE))?.role === "owner") return { role: "owner" };
  // Checked on every request, so a photographer the owner suspends loses access at once.
  const account = await getClient();
  if (account?.isPhotographer && !account.suspended) {
    return { role: "photographer", id: account.id, name: account.name };
  }
  return null;
}

export async function isOwner() {
  return (await getSession())?.role === "owner";
}

export async function startClientSession(account: { id: string }) {
  await writeCookie(ACCOUNT_COOKIE, { id: account.id });
}

// identifier: phone, email, or "admin" for the studio owner.
export async function login(identifier: string, password: string): Promise<"owner" | "account" | null> {
  if (identifier.trim().toLowerCase() === "admin") {
    const expected = ownerPassword();
    if (!expected || password !== expected) return null;
    await writeCookie(OWNER_COOKIE, { role: "owner" });
    return "owner";
  }
  const account = await verifyClient(identifier, password);
  if (!account) return null;
  await startClientSession(account);
  return "account";
}

export async function logout() {
  const jar = await cookies();
  jar.delete(OWNER_COOKIE);
  jar.delete(ACCOUNT_COOKIE);
}

// The event belongs to this session: the owner sees all, a photographer only theirs.
export function canManageEvent(session: Session | null, event: { photographerId: string | null }) {
  if (!session) return false;
  return session.role === "owner" || event.photographerId === session.id;
}
