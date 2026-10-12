import Link from "next/link";
import { redirect } from "next/navigation";
import AccountBookings from "@/components/AccountBookings";
import { getClient } from "@/lib/auth";
import { listClientBookings } from "@/lib/studio";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const client = await getClient();
  if (!client) redirect("/login?next=/account");
  const bookings = await listClientBookings(client.id);
  return (
    <section className="section min-h-screen">
      <div className="mx-auto max-w-3xl">
        <span className="section-label">حسابي</span>
        <h1 className="section-title">
          أهلاً<span className="accent"> {client.name}</span>
        </h1>
        <div className="divider" />
        <p className="mb-10 text-sm text-muted" dir="ltr" style={{ textAlign: "right" }}>
          {client.phone}
        </p>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">حجوزاتي</h2>
          <Link href="/book" className="btn btn-sm">+ حجز جديد</Link>
        </div>
        <AccountBookings bookings={bookings} />
      </div>
    </section>
  );
}
