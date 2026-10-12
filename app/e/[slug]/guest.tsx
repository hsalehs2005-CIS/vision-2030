"use client";
import { useEffect, useRef, useState } from "react";
import { detectMainFace, fileToImage, loadFaceApi, resize } from "@/lib/face-client";
import { downloadUrl } from "@/lib/upload-client";

type Props = { slug: string; name: string; retentionDays: number; allowBrowseAll: boolean };
type Photo = { id: string; width: number; height: number; uploadedAt: string; fullUrl: string; thumbUrl: string };
type Step = "consent" | "selfie" | "working" | "results";

export default function Guest({ slug, name, retentionDays, allowBrowseAll }: Props) {
  const storageKey = `face:${slug}`;
  const [step, setStep] = useState<Step>("consent");
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [open, setOpen] = useState<Photo | null>(null);

  const [fresh, setFresh] = useState(0);
  const query = useRef<object | null>(null);

  async function fetchMatches(body: object): Promise<Photo[]> {
    const res = await fetch(`/api/e/${slug}/match`, { method: "POST", body: JSON.stringify(body) });
    const list: Photo[] = (await res.json()).photos ?? [];
    return list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  async function match(body: object) {
    query.current = body;
    setPhotos(await fetchMatches(body));
    setFresh(0);
    setStep("results");
  }

  // Live: the photographer uploads during the event, so check for new photos.
  useEffect(() => {
    if (step !== "results") return;
    const timer = setInterval(async () => {
      if (!query.current || document.hidden) return;
      try {
        const next = await fetchMatches(query.current);
        setPhotos((prev) => {
          const known = new Set(prev.map((p) => p.id));
          const added = next.filter((p) => !known.has(p.id)).length;
          if (added) setFresh((n) => n + added);
          return next;
        });
      } catch {}
    }, 8000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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
          {fresh > 0 && (
            <button
              className="w-full rounded-xl bg-amber-50 p-3 text-center font-bold text-amber-800"
              onClick={() => setFresh(0)}
            >
              📸 وصلتك {countLabel(fresh)} جديدة
            </button>
          )}
          <p className="flex items-center gap-2 text-xs text-stone-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
            الصفحة تتحدث تلقائياً عند وصول صور جديدة من المصوّر
          </p>
          {!photos.length && (
            <p className="text-stone-600">
              المصوّر يرفع الصور أثناء الحفلة، وستظهر صورك هنا تلقائياً. وإذا لم تظهر بعد فترة جرّب سيلفي أوضح.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((p) => (
              <button key={p.id} onClick={() => setOpen(p)}>
                <img src={p.thumbUrl} alt="" loading="lazy" className="aspect-[3/4] w-full rounded-lg object-cover" />
              </button>
            ))}
          </div>
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-10 flex flex-col bg-black/90 p-4" onClick={() => setOpen(null)}>
          <img src={open.fullUrl} alt="" className="m-auto max-h-[80vh] max-w-full object-contain" />
          <div className="flex justify-center gap-3 pt-4" onClick={(e) => e.stopPropagation()}>
            <a href={downloadUrl(open.fullUrl)} className="btn">تحميل</a>
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
