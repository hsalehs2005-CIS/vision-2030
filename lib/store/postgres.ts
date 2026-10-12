// Events, photos and face descriptors in Postgres with pgvector.
// Face descriptors are vectors, so matching is one SQL query.
import { ensureDb, pool, q } from "../db";
import type { EventMeta, PhotoInfo, Store } from "./types";
import { newEventIds } from "./ids";

const vec = (v: number[]) => `[${v.map(Number).join(",")}]`;

type EventRow = {
  id: string;
  slug: string;
  name: string;
  date: Date | string;
  created_at: Date;
  retention_days: number;
  allow_browse_all: boolean;
  photographer_id: string | null;
};

function toMeta(r: EventRow): EventMeta {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
    createdAt: r.created_at.toISOString(),
    retentionDays: r.retention_days,
    allowBrowseAll: r.allow_browse_all,
    photographerId: r.photographer_id,
  };
}

type PhotoRow = {
  id: string;
  width: number;
  height: number;
  face_count: number;
  full_url: string;
  thumb_url: string;
  uploaded_at: Date;
};

function toPhoto(r: PhotoRow): PhotoInfo {
  return {
    id: r.id,
    width: r.width,
    height: r.height,
    faceCount: r.face_count,
    fullUrl: r.full_url,
    thumbUrl: r.thumb_url,
    uploadedAt: r.uploaded_at.toISOString(),
  };
}

const PHOTO_COLS = "p.id, p.width, p.height, p.face_count, p.full_url, p.thumb_url, p.uploaded_at";

export const postgresStore: Store = {
  async listEvents(photographerId) {
    const rows = await q<EventRow & { photo_count: string }>(
      `SELECT e.*, (SELECT count(*) FROM photos p WHERE p.event_id = e.id) AS photo_count
       FROM events e WHERE ($1::text IS NULL OR e.photographer_id = $1) ORDER BY created_at DESC`,
      [photographerId ?? null],
    );
    return rows.map((r) => ({ ...toMeta(r), photoCount: Number(r.photo_count) }));
  },

  async getEvent(id) {
    const [row] = await q<EventRow>("SELECT * FROM events WHERE id = $1", [id]);
    return row ? toMeta(row) : null;
  },

  async getEventBySlug(slug) {
    const [row] = await q<EventRow>("SELECT * FROM events WHERE slug = $1", [slug]);
    return row ? toMeta(row) : null;
  },

  async listPhotos(eventId) {
    const rows = await q<PhotoRow>(
      `SELECT ${PHOTO_COLS} FROM photos p WHERE p.event_id = $1 ORDER BY p.uploaded_at`,
      [eventId],
    );
    return rows.map(toPhoto);
  },

  async createEvent(input) {
    const { id, slug } = newEventIds();
    const [row] = await q<EventRow>(
      `INSERT INTO events (id, slug, name, date, retention_days, allow_browse_all, photographer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, slug, input.name, input.date, input.retentionDays, input.allowBrowseAll, input.photographerId ?? null],
    );
    return toMeta(row);
  },

  async addPhoto(eventId, photo) {
    await ensureDb();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO photos (id, event_id, width, height, face_count, full_url, thumb_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [photo.id, eventId, photo.width, photo.height, photo.faces.length, photo.fullUrl, photo.thumbUrl],
      );
      for (const face of photo.faces) {
        await client.query("INSERT INTO faces (photo_id, event_id, embedding) VALUES ($1, $2, $3)", [
          photo.id,
          eventId,
          vec(face),
        ]);
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async deletePhoto(eventId, photoId) {
    const rows = await q<PhotoRow>(
      "DELETE FROM photos WHERE id = $1 AND event_id = $2 RETURNING full_url, thumb_url",
      [photoId, eventId],
    );
    return rows.flatMap((r) => [r.full_url, r.thumb_url]);
  },

  async deleteEvent(eventId) {
    const rows = await q<PhotoRow>("SELECT full_url, thumb_url FROM photos WHERE event_id = $1", [eventId]);
    await q("DELETE FROM faces WHERE event_id = $1", [eventId]);
    await q("DELETE FROM events WHERE id = $1", [eventId]);
    return rows.flatMap((r) => [r.full_url, r.thumb_url]);
  },

  async match(eventId, descriptor, threshold) {
    const rows = await q<PhotoRow>(
      `SELECT ${PHOTO_COLS} FROM photos p
       WHERE p.id IN (
         SELECT photo_id FROM faces
         WHERE event_id = $1 AND embedding <-> $2::vector < $3
       )`,
      [eventId, vec(descriptor), threshold],
    );
    return rows.map(toPhoto);
  },

  async expiredEventIds() {
    const rows = await q<{ id: string }>(
      "SELECT id FROM events WHERE date + retention_days < current_date",
    );
    return rows.map((r) => r.id);
  },
};
