import { isOwner } from "@/lib/auth";
import { BOOKING_STATUSES, type BookingStatus, deleteBooking, setBookingStatus } from "@/lib/studio";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { status } = await req.json();
  if (!BOOKING_STATUSES.includes(status)) return Response.json({ error: "bad status" }, { status: 400 });
  await setBookingStatus((await params).id, status as BookingStatus);
  return Response.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return Response.json({ error: "unauthorized" }, { status: 401 });
  await deleteBooking((await params).id);
  return Response.json({ ok: true });
}
