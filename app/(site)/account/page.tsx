import Link from "next/link";
import { redirect } from "next/navigation";
import AccountBookings from "@/components/AccountBookings";
import BecomePhotographer from "@/components/BecomePhotographer";
import { getClient, isOwner } from "@/lib/auth";
import { listClientBookings } from "@/lib/studio";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const client = await getClient();
  if (!client) redirect((await isOwner()) ? "/admin" : "/login?next=/account");
  const bookings = await listClientBookings(client.id);
  return (
    <section className="section min-h-screen">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="section-title">أهلاً {client.name}</h1>
          <p className="text-muted" dir="ltr" style={{ textAlign: "right" }}>
            {client.phone}
          </p>
        </header>

        {client.isPhotographer ? (
          <div className="card flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">حفلاتي</h2>
              <p className="text-sm text-muted">
                {client.suspended ? "حسابك كمصوّر موقوف حالياً، تواصل مع الاستوديو." : "أنشئ حفلة، ارفع الصور، واطبع باركود الضيوف."}
              </p>
            </div>
            {!client.suspended && <Link href="/admin" className="btn">ادخل حفلاتي</Link>}
          </div>
        ) : (
          <div className="card flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">أنت مصوّر؟</h2>
              <p className="text-sm text-muted">فعّل ميزة باركود الحفلات لحسابك: الضيوف يلتقطون سيلفي وتظهر لهم صورهم.</p>
            </div>
            <BecomePhotographer />
          </div>
        )}

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">حجوزاتي</h2>
            <Link href="/book" className="btn btn-sm">+ حجز جديد</Link>
          </div>
          <AccountBookings bookings={bookings} />
        </div>
      </div>
    </section>
  );
}
