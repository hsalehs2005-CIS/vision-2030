import { getClient } from "@/lib/auth";
import { cancelClientBooking } from "@/lib/studio";

// The client withdraws a booking the studio has not confirmed yet.
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await getClient();
  if (!client) return Response.json({ error: "unauthorized" }, { status: 401 });
  const ok = await cancelClientBooking(client.id, (await params).id);
  return ok
    ? Response.json({ ok: true })
    : Response.json({ error: "لا يمكن إلغاء حجز مؤكد، تواصل مع الاستوديو" }, { status: 409 });
}
