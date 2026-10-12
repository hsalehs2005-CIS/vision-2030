import { customAlphabet, nanoid } from "nanoid";

// Short, unambiguous code for the guest link and QR.
const slugId = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 8);

export function newEventIds() {
  return { id: nanoid(12), slug: slugId() };
}

// Photo ids are long random strings, so a guest can only open photos they were given.
export function newPhotoId() {
  return nanoid(16);
}
