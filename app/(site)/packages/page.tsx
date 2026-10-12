import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import { listPackages } from "@/lib/studio";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const packages = await listPackages();
  return (
    <section className="section min-h-screen">
      <span className="section-label">الباقات</span>
      <h1 className="section-title">
        اختر باقتك<span className="accent"> المثالية</span>
      </h1>
      <div className="divider" />
      <p className="section-sub">باقات مصممة لتناسب احتياجاتك وميزانيتك. اختر الباقة واحجز موعدك مباشرة.</p>
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((p) => (
          <PackageCard key={p.id} pkg={p} />
        ))}
        <div className="pkg-card items-center justify-center gap-4 text-center" style={{ border: "1px dashed rgba(201,168,76,0.3)", background: "transparent", minHeight: 300 }}>
          <span className="text-5xl">🎨</span>
          <div className="font-display text-2xl font-bold text-muted">باقة مخصصة</div>
          <p className="text-sm leading-7 text-muted">تحتاج شيئاً مختلفاً؟ أرسل لنا طلبك وسنصمم لك باقة تناسبك بالضبط.</p>
          <Link href="/book" className="btn mt-4">
            اطلب باقة مخصصة
          </Link>
        </div>
      </div>
    </section>
  );
}
