import Link from "next/link";
import BecomePhotographer from "@/components/BecomePhotographer";
import { getClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: "📷", title: "صوّر كالعادة", text: "الصور تنتقل من مجلد الكاميرا إلى الموقع تلقائياً أثناء الحفلة." },
  { icon: "▦", title: "باركود للضيوف", text: "لكل حفلة باركود تطبعه وتضعه على الطاولات أو عند المدخل." },
  { icon: "◉", title: "سيلفي واحد", text: "الضيف يلتقط سيلفي فتظهر له صوره هو فقط، ويحفظها في ألبوم جواله." },
];

export default async function PhotographersPage() {
  const client = await getClient();
  return (
    <section className="section min-h-screen">
      <span className="section-label">للمصورين</span>
      <h1 className="section-title">
        صور الضيوف<span className="accent"> بالباركود</span>
      </h1>
      <p className="section-sub">أنشئ حساب مصوّر وابدأ مباشرة: أنشئ حفلتك، ارفع الصور، واطبع الباركود.</p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.title} className="srv-card">
            <div className="srv-icon">{s.icon}</div>
            <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
            <p className="text-sm leading-7 text-muted">{s.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        {!client ? (
          <>
            <Link href="/login?mode=signup&type=photographer" className="btn">أنشئ حساب مصوّر</Link>
            <Link href="/login" className="btn-ghost">عندي حساب</Link>
          </>
        ) : client.isPhotographer ? (
          <Link href="/admin" className="btn">ادخل حفلاتي</Link>
        ) : (
          <BecomePhotographer label="فعّل ميزة الباركود لحسابي" />
        )}
      </div>
    </section>
  );
}
