export type EventMeta = {
  id: string;
  slug: string;
  name: string;
  date: string;
  createdAt: string;
  retentionDays: number;
  allowBrowseAll: boolean;
  photographerId: string | null; // null = the studio's own event
};

export type EventSummary = EventMeta & { photoCount: number };

export type PhotoInfo = {
  id: string;
  width: number;
  height: number;
  faceCount: number;
  uploadedAt: string;
  fullUrl: string;
  thumbUrl: string;
};

export type NewEvent = Pick<EventMeta, "name" | "date" | "retentionDays" | "allowBrowseAll"> & {
  photographerId?: string | null;
};

export type NewPhoto = {
  id: string;
  width: number;
  height: number;
  faces: number[][]; // 128-d face descriptors, never images of faces
  fullUrl: string;
  thumbUrl: string;
};

export interface Store {
  // All events, or only one photographer's.
  listEvents(photographerId?: string): Promise<EventSummary[]>;
  getEvent(id: string): Promise<EventMeta | null>;
  getEventBySlug(slug: string): Promise<EventMeta | null>;
  listPhotos(eventId: string): Promise<PhotoInfo[]>;
  createEvent(input: NewEvent): Promise<EventMeta>;
  addPhoto(eventId: string, photo: NewPhoto): Promise<void>;
  // Returns the deleted photo's image URLs so the caller can remove the files.
  deletePhoto(eventId: string, photoId: string): Promise<string[]>;
  deleteEvent(eventId: string): Promise<string[]>;
  // Photos with a face closer than `threshold` to the descriptor.
  match(eventId: string, descriptor: number[], threshold: number): Promise<PhotoInfo[]>;
  expiredEventIds(): Promise<string[]>;
}
