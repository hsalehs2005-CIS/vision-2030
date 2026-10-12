import Link from "next/link";

// Placeholder tiles from the design; replace with real portfolio photos later.
const ITEMS = [
  { label: "WEDDING", caption: "تصوير أعراس فاخرة", from: "#1a1208", to: "#2a1e0c", tint: "201,168,76", wide: true },
  { label: "PORTRAIT", caption: "بورتريه فنية", from: "#0d1520", to: "#1a2535", tint: "56,138,221" },
  { label: "EVENT", caption: "مناسبة خاصة", from: "#150d20", to: "#251535", tint: "131,74,221" },
  { label: "NATURE", caption: "تصوير طبيعي", from: "#0d1a12", to: "#152b1e", tint: "15,110,86", wide: true },
  { label: "KIDS", caption: "جلسة أطفال", from: "#201008", to: "#351a0d", tint: "216,90,48" },
  { label: "CORPORATE", caption: "تصوير تجاري", from: "#1a1a1a", to: "#252525", tint: "201,168,76" },
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
            className={`group relative overflow-hidden rounded border border-line ${it.wide ? "sm:col-span-2" : ""}`}
          >
            <div
              className="flex aspect-video flex-col items-center justify-center gap-4 transition duration-500 group-hover:scale-105"
              style={{ background: `linear-gradient(135deg,${it.from},${it.to})` }}
            >
              <div
                className="h-16 w-16 rounded-full"
                style={{ background: `rgba(${it.tint},0.12)`, border: `1px solid rgba(${it.tint},0.3)` }}
              />
              <span className="text-xs tracking-[3px]" style={{ color: `rgba(${it.tint},0.5)` }}>
                {it.label}
              </span>
            </div>
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
              <span className="text-sm tracking-widest text-white">{it.caption}</span>
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
