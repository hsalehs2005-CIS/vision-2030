// Client accounts: people who book sessions sign up with their phone and a password.
import { nanoid } from "nanoid";
import { q } from "./db";
import { checkPassword, hashPassword } from "./studio";

export type Client = { id: string; name: string; phone: string; email: string };

// 05XXXXXXXX, +9665XXXXXXXX and 5XXXXXXXX all become 05XXXXXXXX so one number is one account.
export function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("966")) digits = `0${digits.slice(3)}`;
  if (/^5\d{8}$/.test(digits)) digits = `0${digits}`;
  return digits;
}

export async function registerClient(input: { name: string; phone: string; email: string; password: string }) {
  const phone = normalizePhone(input.phone);
  const existing = await q("SELECT 1 FROM clients WHERE phone = $1", [phone]);
  if (existing.length) return null;
  const id = nanoid(10);
  await q("INSERT INTO clients (id, name, phone, email, password_hash) VALUES ($1, $2, $3, $4, $5)", [
    id,
    input.name,
    phone,
    input.email,
    await hashPassword(input.password),
  ]);
  return { id, name: input.name };
}

export async function verifyClient(phone: string, password: string) {
  const [row] = await q<Client & { password_hash: string }>("SELECT * FROM clients WHERE phone = $1", [
    normalizePhone(phone),
  ]);
  if (!row || !(await checkPassword(password, row.password_hash))) return null;
  return { id: row.id, name: row.name };
}

export async function findClient(id: string) {
  const [row] = await q<Client>("SELECT id, name, phone, email FROM clients WHERE id = $1", [id]);
  return row ?? null;
}
