import Link from "next/link";

// Placeholder tiles from the design; replace with real portfolio photos later.
const ITEMS = [
  { label: "WEDDING", caption: "تصوير أعراس فاخرة", from: "#fef3c7", to: "#fde68a", tint: "201,168,76", wide: true },
  { label: "PORTRAIT", caption: "بورتريه فنية", from: "#e0f2fe", to: "#bae6fd", tint: "56,138,221" },
  { label: "EVENT", caption: "مناسبة خاصة", from: "#ede9fe", to: "#ddd6fe", tint: "131,74,221" },
  { label: "NATURE", caption: "تصوير طبيعي", from: "#dcfce7", to: "#bbf7d0", tint: "15,110,86", wide: true },
  { label: "KIDS", caption: "جلسة أطفال", from: "#ffedd5", to: "#fed7aa", tint: "216,90,48" },
  { label: "CORPORATE", caption: "تصوير تجاري", from: "#f5f5f4", to: "#e7e5e4", tint: "201,168,76" },
];

export default function GalleryPage() {
  return (
    <section className="section">
      <span className="section-label">معرض الأعمال</span>
      <h1 className="section-title">
        لمحة من<span className="accent"> إبداعنا</span>
      </h1>
      <div className="divider" />
      <p className="section-sub">كل صورة تحكي قصة. استعرض مجموعة مختارة من أحدث أعمالنا.</p>
      <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ITEMS.map((it) => (
          <div
            key={it.label}
            className={`group relative overflow-hidden rounded-2xl border border-stone-200 ${it.wide ? "sm:col-span-2" : ""}`}
          >
            <div
              className="flex aspect-video flex-col items-center justify-center gap-4 transition duration-500 group-hover:scale-105"
              style={{ background: `linear-gradient(135deg,${it.from},${it.to})` }}
            >
              <div
                className="h-16 w-16 rounded-full"
                style={{ background: `rgba(${it.tint},0.15)`, border: `1px solid rgba(${it.tint},0.4)` }}
              />
              <span className="text-xs font-bold tracking-widest" style={{ color: `rgba(${it.tint},0.9)` }}>
                {it.label}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-white/80 p-3">
              <span className="text-sm font-bold text-stone-700">{it.caption}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 text-center">
        <Link href="/book" className="btn-ghost">
          احجز جلستك الآن ←
        </Link>
      </div>
    </section>
  );
}
