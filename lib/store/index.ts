import { postgresStore } from "./postgres";

export type * from "./types";
export { newPhotoId } from "./ids";

export const store = postgresStore;
