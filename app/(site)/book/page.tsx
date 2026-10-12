import BookingForm from "@/components/BookingForm";
import AuthForm from "@/components/AuthForm";
import { getClient } from "@/lib/auth";
import { site } from "@/lib/site";
import { bookedDates, listPackages } from "@/lib/studio";

export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ package?: string }> }) {
  const [{ package: selected }, packages, booked, client] = await Promise.all([
    searchParams,
    listPackages(),
    bookedDates(),
    getClient(),
  ]);
  return (
    <section className="section min-h-screen">
      <div className="grid gap-16 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <span className="section-label">الحجز</span>
          <h1 className="section-title">
            احجز<span className="accent"> جلستك</span>
          </h1>
          <div className="divider" />
          <p className="section-sub">
            اختر الباقة والتاريخ المناسب، وسنتواصل معك لتأكيد الموعد خلال 24 ساعة.
          </p>
          <ul className="mt-10 space-y-5 text-sm text-muted">
            <li className="flex gap-3"><span className="text-gold">📍</span>{site.address}</li>
            <li className="flex gap-3"><span className="text-gold">📞</span><span dir="ltr">{site.phone}</span></li>
            <li className="flex gap-3"><span className="text-gold">🕘</span>{site.hours}</li>
          </ul>
        </div>
        {!client ? (
          <div>
            <p className="mb-4 text-sm text-muted">سجّل دخولك أو أنشئ حساباً لإكمال الحجز ومتابعته.</p>
            <AuthForm stay initialMode="signup" />
          </div>
        ) : (
        <BookingForm
          client={{ name: client.name, phone: client.phone }}
          packages={packages.map((p) => ({ id: p.id, name: p.name, price: p.price, unit: p.unit }))}
          booked={booked}
          initialPackage={packages.some((p) => p.id === selected) ? selected! : ""}
        />
        )}
      </div>
    </section>
  );
}
