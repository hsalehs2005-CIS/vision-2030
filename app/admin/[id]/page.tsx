"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
import { canvasToJpeg, detectAllFaces, fileToImage, loadFaceApi, resize } from "@/lib/face-client";

type Photo = { id: string; faceCount: number };
type EventDetail = {
  id: string;
  slug: string;
  name: string;
  date: string;
  retentionDays: number;
  photos: Photo[];
};

export default function EventAdmin() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [qr, setQr] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/events/${id}`);
    if (res.status === 401) return router.push("/admin");
    setEvent(await res.json());
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const guestUrl = event ? `${typeof window !== "undefined" ? window.location.origin : ""}/e/${event.slug}` : "";
  useEffect(() => {
    if (guestUrl) QRCode.toDataURL(guestUrl, { width: 512, margin: 1 }).then(setQr);
  }, [guestUrl]);

  async function upload(files: FileList) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setProgress({ done: 0, total: list.length });
    await loadFaceApi();
    let done = 0;
    // Process a few at a time: detection is on this device, upload in parallel.
    const queue = [...list];
    async function worker() {
      for (let file = queue.shift(); file; file = queue.shift()) {
        try {
          const img = await fileToImage(file);
          const faces = await detectAllFaces(resize(img, 1600));
          const form = new FormData();
          form.set("full", await canvasToJpeg(resize(img, 3000), 0.9));
          form.set("thumb", await canvasToJpeg(resize(img, 800), 0.8));
          form.set("faces", JSON.stringify(faces));
          form.set("width", String(img.naturalWidth));
          form.set("height", String(img.naturalHeight));
          await fetch(`/api/events/${id}/photos`, { method: "POST", body: form });
        } catch (err) {
          console.error("upload failed", file.name, err);
        }
        setProgress({ done: ++done, total: list.length });
      }
    }
    await Promise.all([worker(), worker()]);
    setProgress(null);
    load();
  }

  if (!event) return null;
  const faces = event.photos.reduce((n, p) => n + p.faceCount, 0);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <Link href="/admin" className="text-sm text-stone-500">→ كل الحفلات</Link>
      <header>
        <h1 className="text-3xl font-extrabold">{event.name}</h1>
        <p className="text-stone-500">
          {event.date} · {event.photos.length} صورة · {faces} وجه · تُحذف بعد {event.retentionDays} يوم
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <section className="card space-y-4">
          <h2 className="text-xl font-bold">رفع الصور</h2>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 p-10 text-center hover:border-amber-600">
            <span className="text-lg font-bold">اختر الصور أو اسحبها هنا</span>
            <span className="text-sm text-stone-500">يتم اكتشاف الوجوه تلقائياً قبل الرفع</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={!!progress}
              onChange={(e) => e.target.files && upload(e.target.files)}
            />
          </label>
          {progress && (
            <div>
              <div className="mb-1 text-sm">
                جاري المعالجة {progress.done} من {progress.total}
              </div>
              <div className="h-2 overflow-hidden rounded bg-stone-200">
                <div className="h-full bg-amber-600 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
            </div>
          )}
        </section>

        <section className="card space-y-3 text-center">
          <h2 className="text-xl font-bold">باركود الضيوف</h2>
          {qr && <img src={qr} alt="باركود الحفلة" className="mx-auto w-full max-w-[220px]" />}
          <a href={guestUrl} target="_blank" className="block break-all text-sm text-amber-700 underline" dir="ltr">
            {guestUrl}
          </a>
          {qr && (
            <a href={qr} download={`qr-${event.slug}.png`} className="btn-ghost w-full">
              تحميل الباركود للطباعة
            </a>
          )}
        </section>
      </div>

      <section className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {event.photos.map((p) => (
          <div key={p.id} className="group relative">
            <img
              src={`/api/photos/${event.id}/${p.id}?size=thumb`}
              alt=""
              loading="lazy"
              className="aspect-square w-full rounded-lg object-cover"
            />
            <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 text-xs text-white">
              {p.faceCount} وجه
            </span>
            <button
              className="absolute left-1 top-1 hidden rounded bg-black/60 px-1.5 text-xs text-white group-hover:block"
              onClick={async () => {
                await fetch(`/api/events/${event.id}/photos/${p.id}`, { method: "DELETE" });
                load();
              }}
            >
              حذف
            </button>
          </div>
        ))}
      </section>

      <button
        className="text-sm text-red-600 underline"
        onClick={async () => {
          if (!confirm("حذف الحفلة وكل صورها وبيانات الوجوه نهائياً؟")) return;
          await fetch(`/api/events/${event.id}`, { method: "DELETE" });
          router.push("/admin");
        }}
      >
        حذف الحفلة نهائياً
      </button>
    </main>
  );
}
