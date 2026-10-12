"use client";
import { useEffect, useState } from "react";
import { detectMainFace, fileToImage, loadFaceApi, resize } from "@/lib/face-client";

type Props = { slug: string; eventId: string; name: string; retentionDays: number; allowBrowseAll: boolean };
type Photo = { id: string; width: number; height: number };
type Step = "consent" | "selfie" | "working" | "results";

export default function Guest({ slug, eventId, name, retentionDays, allowBrowseAll }: Props) {
  const storageKey = `face:${slug}`;
  const [step, setStep] = useState<Step>("consent");
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [open, setOpen] = useState<Photo | null>(null);

  async function match(body: object) {
    const res = await fetch(`/api/e/${slug}/match`, { method: "POST", body: JSON.stringify(body) });
    setPhotos((await res.json()).photos ?? []);
    setStep("results");
  }

  // Returning guest: the descriptor (numbers only, no image) stays on this phone.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setStep("working");
        match({ descriptor: JSON.parse(saved) });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSelfie(file: File) {
    setError("");
    setStep("working");
    try {
      const [img] = await Promise.all([fileToImage(file), loadFaceApi()]);
      const descriptor = await detectMainFace(resize(img, 1024));
      if (!descriptor) {
        setError("لم نتمكن من رؤية وجهك بوضوح. جرّب مرة أخرى في إضاءة أفضل ومواجهاً للكاميرا.");
        setStep("selfie");
        return;
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(descriptor));
      } catch {}
      await match({ descriptor });
    } catch (err) {
      console.error(err);
      setError("حدث خطأ، حاول مرة أخرى.");
      setStep("selfie");
    }
  }

  function refresh() {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey);
    } catch {}
    match(saved ? { descriptor: JSON.parse(saved) } : { all: true });
  }

  function forget() {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setPhotos([]);
    setStep("consent");
  }

  const src = (p: Photo, thumb = false) => `/api/photos/${eventId}/${p.id}${thumb ? "?size=thumb" : ""}`;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="mb-6 text-center">
        <p className="text-sm font-bold text-amber-700">صور الحفلة</p>
        <h1 className="text-3xl font-extrabold">{name}</h1>
      </header>

      {step === "consent" && (
        <section className="card mx-auto max-w-md space-y-4">
          <h2 className="text-xl font-bold">قبل أن نبدأ</h2>
          <ul className="list-disc space-y-2 pr-5 text-stone-700">
            <li>سنستخدم صورة السيلفي فقط للبحث عن صورك في هذه الحفلة.</li>
            <li>السيلفي تتم معالجته على جوالك ولا يُرفع إلى الخادم ولا يُحفظ.</li>
            <li>صور الحفلة وبيانات الوجوه تُحذف تلقائياً بعد {retentionDays} يوم.</li>
            <li>تستطيع مسح بياناتك من هذا الجهاز في أي وقت.</li>
          </ul>
          <button className="btn w-full" onClick={() => setStep("selfie")}>
            أوافق، لنبدأ
          </button>
          {allowBrowseAll && (
            <button className="btn-ghost w-full" onClick={() => match({ all: true })}>
              تصفح كل الصور بدون سيلفي
            </button>
          )}
        </section>
      )}

      {step === "selfie" && (
        <section className="card mx-auto max-w-md space-y-4 text-center">
          <div className="text-6xl">🤳</div>
          <h2 className="text-xl font-bold">التقط سيلفي</h2>
          <p className="text-stone-600">واجه الكاميرا في مكان مضاء، بدون نظارة شمسية.</p>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <label className="btn w-full cursor-pointer">
            فتح الكاميرا
            <input
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onSelfie(e.target.files[0])}
            />
          </label>
        </section>
      )}

      {step === "working" && (
        <section className="py-20 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-amber-600" />
          <p className="mt-4 font-bold">نبحث عن صورك...</p>
        </section>
      )}

      {step === "results" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold">
              {photos.length ? `وجدنا لك ${countLabel(photos.length)}` : "لم نجد صوراً لك حتى الآن"}
            </p>
            <div className="flex gap-2">
              <button className="btn-ghost px-3 py-2 text-sm" onClick={refresh}>
                تحديث
              </button>
              <button className="btn-ghost px-3 py-2 text-sm" onClick={forget}>
                مسح بياناتي
              </button>
            </div>
          </div>
          {!photos.length && (
            <p className="text-stone-600">
              المصوّر يرفع الصور أثناء الحفلة، اضغط "تحديث" بعد قليل. وإذا استمرت المشكلة جرّب سيلفي أوضح.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((p) => (
              <button key={p.id} onClick={() => setOpen(p)}>
                <img src={src(p, true)} alt="" loading="lazy" className="aspect-[3/4] w-full rounded-lg object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-10 flex flex-col bg-black/90 p-4" onClick={() => setOpen(null)}>
          <img src={src(open)} alt="" className="m-auto max-h-[80vh] max-w-full object-contain" />
          <div className="flex justify-center gap-3 pt-4" onClick={(e) => e.stopPropagation()}>
            <a href={`${src(open)}?download=1`} className="btn">تحميل</a>
            <button className="btn-ghost text-white" onClick={() => setOpen(null)}>إغلاق</button>
          </div>
        </div>
      )}
    </main>
  );
}

function countLabel(n: number) {
  if (n === 1) return "صورة واحدة";
  if (n === 2) return "صورتين";
  if (n <= 10) return `${n} صور`;
  return `${n} صورة`;
}
