// Accounts: everyone signs up the same way (name, phone, optional email, password).
// Clients book sessions; an account marked as photographer also gets QR events.
import { randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import { q } from "./db";
import { checkPassword, hashPassword } from "./studio";

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  isPhotographer: boolean;
  suspended: boolean;
};

type Row = {
  id: string;
  name: string;
  phone: string;
  email: string;
  is_photographer: boolean;
  suspended: boolean;
  password_hash: string;
  created_at: Date;
};

const toClient = (r: Row): Client => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  email: r.email,
  isPhotographer: r.is_photographer,
  suspended: r.suspended,
});

// 05XXXXXXXX, +9665XXXXXXXX and 5XXXXXXXX all become 05XXXXXXXX so one number is one account.
export function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("966")) digits = `0${digits.slice(3)}`;
  if (/^5\d{8}$/.test(digits)) digits = `0${digits}`;
  return digits;
}

export async function registerClient(input: {
  name: string;
  phone: string;
  email: string;
  password: string;
  photographer: boolean;
}) {
  const phone = normalizePhone(input.phone);
  const email = input.email.toLowerCase();
  if ((await q("SELECT 1 FROM clients WHERE phone = $1", [phone])).length) {
    return { error: "هذا الجوال مسجّل، سجّل دخولك" } as const;
  }
  if (email && (await q("SELECT 1 FROM clients WHERE lower(email) = $1", [email])).length) {
    return { error: "هذا البريد مسجّل، سجّل دخولك" } as const;
  }
  const id = nanoid(10);
  await q(
    "INSERT INTO clients (id, name, phone, email, password_hash, is_photographer) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, input.name, phone, email, await hashPassword(input.password), input.photographer],
  );
  return { id } as const;
}

// Sign in with either the phone number or the email.
export async function verifyClient(identifier: string, password: string) {
  const [row] = await q<Row>(
    identifier.includes("@") ? "SELECT * FROM clients WHERE lower(email) = lower($1)" : "SELECT * FROM clients WHERE phone = $1",
    [identifier.includes("@") ? identifier.trim() : normalizePhone(identifier)],
  );
  if (!row || !(await checkPassword(password, row.password_hash))) return null;
  return toClient(row);
}

export async function findClient(id: string) {
  const [row] = await q<Row>("SELECT * FROM clients WHERE id = $1", [id]);
  return row ? toClient(row) : null;
}

// Any account can switch on the QR events feature for itself.
export async function becomePhotographer(id: string) {
  await q("UPDATE clients SET is_photographer = true WHERE id = $1", [id]);
}

// ---------- Owner tools for photographer accounts ----------

export type Photographer = Client & { createdAt: string; eventCount: number };

export async function listPhotographers(): Promise<Photographer[]> {
  const rows = await q<Row & { event_count: string }>(
    `SELECT c.*, (SELECT count(*) FROM events e WHERE e.photographer_id = c.id) AS event_count
     FROM clients c WHERE c.is_photographer ORDER BY c.created_at DESC`,
  );
  return rows.map((r) => ({ ...toClient(r), createdAt: r.created_at.toISOString(), eventCount: Number(r.event_count) }));
}

export async function setSuspended(id: string, suspended: boolean) {
  await q("UPDATE clients SET suspended = $2 WHERE id = $1", [id, suspended]);
}

// For someone who forgot their password: a fresh one, shown once to the owner to send on.
export async function resetPassword(id: string) {
  const password = randomBytes(6).toString("base64url");
  await q("UPDATE clients SET password_hash = $2 WHERE id = $1", [id, await hashPassword(password)]);
  return password;
}

export async function deleteClient(id: string) {
  await q("DELETE FROM clients WHERE id = $1", [id]);
}
