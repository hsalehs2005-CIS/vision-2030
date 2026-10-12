// Studio business data: packages, client bookings, and photographers who
// asked to use the QR photo feature.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { nanoid } from "nanoid";
import { q } from "./db";

const scrypt = promisify(scryptCb) as (pw: string, salt: string, len: number) => Promise<Buffer>;

// ---------- Packages ----------

export type Package = {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  unit: string;
  features: string[];
  featured: boolean;
  active: boolean;
  sort: number;
};

export type PackageInput = Omit<Package, "id">;

export async function listPackages(includeHidden = false) {
  return q<Package>(
    `SELECT id, name, description, icon, price, unit, features, featured, active, sort
     FROM packages ${includeHidden ? "" : "WHERE active"} ORDER BY sort, created_at`,
  );
}

export async function getPackage(id: string) {
  const [row] = await q<Package>("SELECT * FROM packages WHERE id = $1", [id]);
  return row ?? null;
}

export function cleanPackage(body: Record<string, unknown>): PackageInput | null {
  const name = String(body.name ?? "").trim();
  const price = Math.round(Number(body.price));
  if (!name || !Number.isFinite(price) || price < 0) return null;
  const features = Array.isArray(body.features)
    ? body.features.map((f) => String(f).trim()).filter(Boolean).slice(0, 20)
    : [];
  return {
    name: name.slice(0, 80),
    description: String(body.description ?? "").trim().slice(0, 300),
    icon: String(body.icon ?? "📸").trim().slice(0, 8) || "📸",
    price,
    unit: String(body.unit ?? "جلسة").trim().slice(0, 20) || "جلسة",
    features,
    featured: Boolean(body.featured),
    active: body.active === undefined ? true : Boolean(body.active),
    sort: Math.round(Number(body.sort) || 0),
  };
}

export async function createPackage(p: PackageInput) {
  const id = nanoid(10);
  await q(
    `INSERT INTO packages (id, name, description, icon, price, unit, features, featured, active, sort)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, p.name, p.description, p.icon, p.price, p.unit, JSON.stringify(p.features), p.featured, p.active, p.sort],
  );
  return id;
}

export async function updatePackage(id: string, p: PackageInput) {
  await q(
    `UPDATE packages SET name=$2, description=$3, icon=$4, price=$5, unit=$6, features=$7,
       featured=$8, active=$9, sort=$10 WHERE id=$1`,
    [id, p.name, p.description, p.icon, p.price, p.unit, JSON.stringify(p.features), p.featured, p.active, p.sort],
  );
}

export async function deletePackage(id: string) {
  await q("DELETE FROM packages WHERE id = $1", [id]);
}

// ---------- Bookings ----------

export const BOOKING_STATUSES = ["pending", "confirmed", "done", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type Booking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  packageId: string | null;
  packageName: string;
  price: number | null;
  date: string;
  time: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
};

type BookingRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  package_id: string | null;
  package_name: string;
  price: number | null;
  date: Date;
  time: string;
  notes: string;
  status: BookingStatus;
  created_at: Date;
};

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function toBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    packageId: r.package_id,
    packageName: r.package_name,
    price: r.price,
    date: isoDate(r.date),
    time: r.time,
    notes: r.notes,
    status: r.status,
    createdAt: r.created_at.toISOString(),
  };
}

export async function listBookings() {
  const rows = await q<BookingRow>("SELECT * FROM bookings ORDER BY date DESC, time DESC, created_at DESC");
  return rows.map(toBooking);
}

// Days already taken by a confirmed booking (no client details, safe to show publicly).
export async function bookedDates() {
  const rows = await q<{ date: Date }>(
    "SELECT DISTINCT date FROM bookings WHERE status = 'confirmed' AND date >= current_date ORDER BY date",
  );
  return rows.map((r) => isoDate(r.date));
}

export async function createBooking(input: {
  name: string;
  phone: string;
  email: string;
  packageId: string | null;
  date: string;
  time: string;
  notes: string;
}) {
  const pkg = input.packageId ? await getPackage(input.packageId) : null;
  const id = nanoid(10);
  await q(
    `INSERT INTO bookings (id, name, phone, email, package_id, package_name, price, date, time, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id,
      input.name,
      input.phone,
      input.email,
      pkg?.id ?? null,
      pkg?.name ?? "باقة مخصصة",
      pkg?.price ?? null,
      input.date,
      input.time,
      input.notes,
    ],
  );
  return id;
}

export async function setBookingStatus(id: string, status: BookingStatus) {
  await q("UPDATE bookings SET status = $2 WHERE id = $1", [id, status]);
}

export async function deleteBooking(id: string) {
  await q("DELETE FROM bookings WHERE id = $1", [id]);
}

// ---------- Photographers ----------

export type Photographer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  studio: string;
  city: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  eventCount: number;
};

export async function listPhotographers() {
  const rows = await q<Omit<Photographer, "createdAt" | "eventCount"> & { created_at: Date; event_count: string }>(
    `SELECT p.id, p.name, p.phone, p.email, p.studio, p.city, p.message, p.status, p.created_at,
       (SELECT count(*) FROM events e WHERE e.photographer_id = p.id) AS event_count
     FROM photographers p ORDER BY p.created_at DESC`,
  );
  return rows.map(({ created_at, event_count, ...p }) => ({
    ...p,
    createdAt: created_at.toISOString(),
    eventCount: Number(event_count),
  }));
}

export async function requestPhotographer(input: {
  name: string;
  phone: string;
  email: string;
  studio: string;
  city: string;
  message: string;
  password: string;
}) {
  const existing = await q<{ id: string }>("SELECT id FROM photographers WHERE lower(email) = lower($1)", [input.email]);
  if (existing.length) return null;
  const id = nanoid(10);
  await q(
    `INSERT INTO photographers (id, name, phone, email, studio, city, message, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, input.name, input.phone, input.email, input.studio, input.city, input.message, await hashPassword(input.password)],
  );
  return id;
}

async function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await scrypt(pw, salt, 32)).toString("hex")}`;
}

async function checkPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const actual = await scrypt(pw, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

export async function approvePhotographer(id: string) {
  await q("UPDATE photographers SET status = 'approved' WHERE id = $1", [id]);
}

// For a photographer who forgot their password: a fresh one, shown once to the owner to send on.
export async function resetPhotographerPassword(id: string) {
  const password = randomBytes(6).toString("base64url");
  await q("UPDATE photographers SET password_hash = $2 WHERE id = $1", [id, await hashPassword(password)]);
  return password;
}

export async function rejectPhotographer(id: string) {
  await q("UPDATE photographers SET status = 'rejected' WHERE id = $1", [id]);
}

export async function deletePhotographer(id: string) {
  await q("DELETE FROM photographers WHERE id = $1", [id]);
}

export async function verifyPhotographer(email: string, password: string) {
  const [row] = await q<{ id: string; name: string; password_hash: string | null; status: string }>(
    "SELECT id, name, password_hash, status FROM photographers WHERE lower(email) = lower($1)",
    [email],
  );
  if (!row || row.status !== "approved" || !row.password_hash) return null;
  return (await checkPassword(password, row.password_hash)) ? { id: row.id, name: row.name } : null;
}

export async function photographerStatus(id: string) {
  const [row] = await q<{ status: Photographer["status"] }>("SELECT status FROM photographers WHERE id = $1", [id]);
  return row?.status ?? null;
}

export async function isApprovedPhotographer(id: string) {
  return (await photographerStatus(id)) === "approved";
}
