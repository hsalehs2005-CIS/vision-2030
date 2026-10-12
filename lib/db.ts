// Postgres connection and schema. Tables are created (and default packages
// seeded) on first use, so a fresh Neon database needs no manual setup.
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const pool = new Pool({
  connectionString,
  max: 5,
  ssl: /localhost|127\.0\.0\.1/.test(connectionString ?? "") ? false : { rejectUnauthorized: false },
});

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS photographers (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE NOT NULL,
  studio text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  retention_days int NOT NULL,
  allow_browse_all boolean NOT NULL DEFAULT false
);
-- The account (clients.id) of the photographer who owns the event; null for the studio's own.
ALTER TABLE events ADD COLUMN IF NOT EXISTS photographer_id text;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_photographer_id_fkey;

CREATE TABLE IF NOT EXISTS photos (
  id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  width int NOT NULL,
  height int NOT NULL,
  face_count int NOT NULL,
  full_url text NOT NULL,
  thumb_url text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photos_event_idx ON photos(event_id, uploaded_at);

CREATE TABLE IF NOT EXISTS faces (
  photo_id text NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  embedding vector(128) NOT NULL
);
CREATE INDEX IF NOT EXISTS faces_event_idx ON faces(event_id);

CREATE TABLE IF NOT EXISTS packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '📸',
  price int NOT NULL,
  unit text NOT NULL DEFAULT 'جلسة',
  features jsonb NOT NULL DEFAULT '[]',
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL DEFAULT '',
  package_id text REFERENCES packages(id) ON DELETE SET NULL,
  package_name text NOT NULL DEFAULT '',
  price int,
  date date NOT NULL,
  time text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings(date);
CREATE TABLE IF NOT EXISTS clients (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_id text REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS bookings_client_idx ON bookings(client_id);

-- One account type for everyone: a photographer is an account with is_photographer.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_photographer boolean NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
-- Move accounts from the old separate photographers table (same ids keep their events).
INSERT INTO clients (id, name, phone, email, password_hash, is_photographer, suspended, created_at)
  SELECT id, name, phone, email, password_hash, true, status = 'rejected', created_at
  FROM photographers WHERE password_hash IS NOT NULL
  ON CONFLICT DO NOTHING;
DELETE FROM photographers;
`;

// Starting packages; the owner edits them from the dashboard.
const DEFAULT_PACKAGES = [
  ["basic", "الباقة الأساسية", "مثالية للجلسات الخاصة والبورتريه البسيطة", "🌱", 499, "جلسة",
    ["جلسة تصوير لمدة ساعتين", "30 صورة معدّلة", "تسليم خلال 5 أيام", "ألبوم رقمي"], false],
  ["gold", "الباقة الذهبية", "الأنسب للمناسبات والأعراس والتجمعات العائلية", "⭐", 1299, "مناسبة",
    ["تغطية 6 ساعات كاملة", "100+ صورة معدّلة", "مصوّران محترفان", "صور فورية للضيوف بالباركود", "تسليم خلال 3 أيام"], true],
  ["diamond", "الباقة الماسية", "تغطية شاملة للمناسبات الكبرى", "💎", 2999, "يوم",
    ["يوم تصوير كامل (10 ساعات)", "صور + فيديو 4K", "فريق 3 محترفين", "صور فورية للضيوف بالباركود", "تسليم خلال 24 ساعة"], false],
  ["kids", "باقة الأطفال", "جلسة مميزة لطفلك بأجواء مرحة وألوان دافئة", "👶", 699, "جلسة",
    ["جلسة 3 ساعات", "50 صورة معدّلة", "ديكور وإكسسوارات", "4 صور مطبوعة A4"], false],
] as const;

async function init() {
  await pool.query(SCHEMA);
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM packages");
  if (rows[0].n === 0) {
    for (const [i, [id, name, desc, icon, price, unit, features, featured]] of DEFAULT_PACKAGES.entries()) {
      await pool.query(
        `INSERT INTO packages (id, name, description, icon, price, unit, features, featured, sort)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
        [id, name, desc, icon, price, unit, JSON.stringify(features), featured, i],
      );
    }
  }
}

let ready: Promise<unknown> | null = null;
export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []) {
  ready ??= init().catch((err) => {
    ready = null;
    throw err;
  });
  await ready;
  return (await pool.query(text, params)).rows as T[];
}

// Makes sure the schema exists before using `pool` directly (transactions).
export async function ensureDb() {
  await q("SELECT 1");
}
