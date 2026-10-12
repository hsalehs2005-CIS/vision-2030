import Link from "next/link";
import { site } from "@/lib/site";

const SERVICES = [
  ["💍", "تصوير الأعراس", "نوثّق كل لحظة من يومك الأهم بعدسة احترافية وإحساس فني راقٍ"],
  ["📲", "صور فورية للضيوف", "كل ضيف يصوّر الباركود ويلتقط سيلفي، فتظهر له صوره من الحفلة مباشرة"],
  ["👶", "تصوير الأطفال", "جلسات مرحة ودافئة تجمد أجمل لحظات طفلك وبراءته"],
  ["🏢", "تصوير الشركات", "صور احترافية للفريق والمنتجات تعكس هوية علامتك التجارية"],
  ["🌅", "تصوير المناسبات", "تغطية شاملة للحفلات والتجمعات العائلية"],
  ["✏️", "تعديل احترافي", "معالجة متقدمة للصور بأعلى معايير الجودة وتسليم سريع"],
];

const GEAR = ["📷 Canon EOS R5", "🎥 Sony A7 IV", "💡 إضاءة Studio", "🖥️ تسليم سحابي", "📲 صور فورية بالباركود", "🎨 Lightroom"];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="floating-lens" />
        <div className="floating-lens2" />
        <div className="relative z-10 max-w-4xl text-center">
          <div className="hero-badge fade-up">📸 محترفون في الصورة</div>
          <h1 className="hero-title fade-up" style={{ animationDelay: "0.2s" }}>
            ذكرى
            <span className="accent block">تصنع للحظات الخالدة</span>
          </h1>
          <p
            className="fade-up mx-auto mb-12 max-w-xl text-lg leading-8 text-muted"
            style={{ animationDelay: "0.4s" }}
          >
            معدات احترافية وخبرة سنوات، وصور تحكي قصتك بأبهى صورة. وفي حفلتك، كل ضيف يستلم صوره على جواله في نفس
            اللحظة.
          </p>
          <div className="fade-up mb-12 flex flex-wrap justify-center gap-4" style={{ animationDelay: "0.6s" }}>
            <Link href="/packages" className="btn px-10 py-4">
              استكشف الباقات
            </Link>
            <Link href="/gallery" className="btn-ghost px-10 py-4">
              شاهد أعمالنا
            </Link>
          </div>
          <div className="fade-up flex flex-wrap justify-center gap-8 md:gap-12" style={{ animationDelay: "0.8s" }}>
            {site.stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl font-bold text-gold">{s.num}</div>
                <div className="mt-1 text-xs tracking-widest text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-ink-2">
        <div className="mb-4 text-center">
          <span className="section-label">خدماتنا</span>
          <h2 className="section-title">
            كل ما تحتاجه في<span className="accent"> مكان واحد</span>
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(([icon, title, text]) => (
            <div key={title} className="srv-card">
              <div className="srv-icon">{icon}</div>
              <h3 className="mb-3 font-display text-lg">{title}</h3>
              <p className="text-sm leading-7 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section text-center" style={{ background: "linear-gradient(135deg,#0a0a0a,#0d0c09)" }}>
        <span className="section-label">لماذا نحن</span>
        <h2 className="section-title">
          الجودة ليست خياراً<span className="accent"> — هي معيارنا</span>
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {GEAR.map((g) => (
            <span key={g} className="pill">
              {g}
            </span>
          ))}
        </div>
        <div className="mt-12">
          <Link href="/book" className="btn px-10 py-4">
            احجز جلستك الآن
          </Link>
        </div>
      </section>
    </>
  );
}
