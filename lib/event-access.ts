import { canManageEvent, getSession } from "./auth";
import { store } from "./store";

// Loads an event the current user may manage, or returns the error response to send.
export async function managedEvent(id: string) {
  const session = await getSession();
  if (!session) return { error: Response.json({ error: "unauthorized" }, { status: 401 }) };
  const event = await store.getEvent(id);
  if (!event || !canManageEvent(session, event)) {
    return { error: Response.json({ error: "not found" }, { status: 404 }) };
  }
  return { event, session };
}
