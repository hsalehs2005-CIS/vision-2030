import { site } from "@/lib/site";

export default function AboutPage() {
  return (
    <>
      <section className="section">
        <div className="grid items-center gap-16 md:grid-cols-2">
          <div>
            <span className="section-label">من نحن</span>
            <h1 className="section-title">
              شغف بالصورة<span className="accent"> منذ {site.since}</span>
            </h1>
            <div className="divider" />
            <p className="mb-6 leading-8 text-muted">
              بدأنا رحلتنا في عالم التصوير من شغف حقيقي بالضوء والتكوين والقصص الإنسانية، ونحرص أن تصل كل لحظة
              لأصحابها كما عاشوها.
            </p>
            <p className="mb-8 leading-8 text-muted">
              ومع ميزة الصور الفورية، كل ضيف في حفلتك يصوّر الباركود ويلتقط سيلفي، فتظهر له صوره من عدسة المصوّر خلال
              ثوانٍ.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <span className="pill">📍 {site.city}</span>
              <span className="pill">📲 صور فورية للضيوف</span>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-4">
              {site.stats.map((s) => (
                <div key={s.label} className="card text-center">
                  <div className="font-display text-3xl font-bold text-gold">{s.num}</div>
                  <div className="mt-1 text-xs tracking-widest text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded border border-line bg-card">
            <div className="flex h-4/5 w-4/5 flex-col items-center justify-center gap-4 rounded border border-gold/15">
              <div className="aperture">
                <div className="aperture-inner">
                  <div className="aperture-dot" />
                </div>
              </div>
              <p className="text-xs tracking-widest text-muted">{site.name}</p>
            </div>
            <span className="absolute right-6 top-6 text-xs tracking-widest text-gold/40">f/1.4</span>
            <span className="absolute bottom-6 left-6 text-xs tracking-widest text-gold/40">1/500s</span>
            <span className="absolute bottom-6 right-6 text-xs tracking-widest text-gold/40">ISO 100</span>
          </div>
        </div>
      </section>
      {site.testimonials.length > 0 && (
        <section className="section">
          <div className="text-center">
            <span className="section-label">آراء العملاء</span>
            <h2 className="section-title">
              ماذا يقول<span className="accent"> عملاؤنا</span>
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {site.testimonials.map((t) => (
              <div key={t.name} className="card p-8 transition hover:border-gold/20">
                <div className="mb-4 font-display text-4xl leading-none text-gold/50">&ldquo;</div>
                <p className="mb-6 text-sm leading-7 text-muted">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 bg-gold/15 font-bold text-gold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
