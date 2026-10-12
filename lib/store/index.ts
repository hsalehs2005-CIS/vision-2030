import { localStore } from "./local";
import { postgresStore } from "./postgres";
import type { Store } from "./types";

export type * from "./types";
export { newPhotoId } from "./ids";

export const store: Store =
  process.env.DATABASE_URL || process.env.POSTGRES_URL ? postgresStore : localStore;
