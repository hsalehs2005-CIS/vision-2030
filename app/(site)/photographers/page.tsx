import PhotographerRequestForm from "@/components/PhotographerRequestForm";
import { myPhotographerRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: "📷", title: "صوّر كالعادة", text: "الصور تنتقل من مجلد الكاميرا إلى الموقع تلقائياً أثناء الحفلة." },
  { icon: "▦", title: "باركود للضيوف", text: "لكل حفلة باركود تطبعه وتضعه على الطاولات أو عند المدخل." },
  { icon: "◉", title: "سيلفي واحد", text: "الضيف يلتقط سيلفي فتظهر له صوره هو فقط، ويحفظها في ألبوم جواله." },
];

export default async function PhotographersPage() {
  const mine = await myPhotographerRequest();
  return (
    <section className="section min-h-screen">
      <span className="section-label">للمصورين</span>
      <h1 className="section-title">
        صور الضيوف<span className="accent"> بالباركود</span>
      </h1>
      <div className="divider" />
      <p className="section-sub">
        أنت مصوّر وتريد أن يحصل ضيوف حفلاتك على صورهم فوراً؟ أرسل طلبك، وبمجرد موافقة الاستوديو يظهر لك زر الدخول للوحتك تنشئ منها حفلاتك.
      </p>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.title} className="srv-card">
            <div className="srv-icon">{s.icon}</div>
            <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
            <p className="text-sm leading-7 text-muted">{s.text}</p>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-16 max-w-2xl">
        <PhotographerRequestForm initial={mine ? { name: mine.name, status: mine.status } : null} />
      </div>
    </section>
  );
}
