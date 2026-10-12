"use client";
// Live mode: watches a folder on the photographer's computer (where the camera's
// Wi-Fi/tethering software drops new shots) and uploads each new photo automatically.
import { useEffect, useRef, useState } from "react";
import { loadFaceApi } from "@/lib/face-client";
import { type UploadMode, uploadPhoto } from "@/lib/upload-client";

type DirHandle = {
  name: string;
  values(): AsyncIterable<{ kind: "file" | "directory"; name: string; getFile(): Promise<File> }>;
};

const IMAGE = /\.(jpe?g|png|webp)$/i;
const POLL_MS = 3000;
// Skip files modified in the last moment: the camera may still be writing them.
const SETTLE_MS = 1500;

export default function LiveFolder({
  eventId,
  mode,
  onUploaded,
}: {
  eventId: string;
  mode: UploadMode;
  onUploaded: () => void;
}) {
  const [supported, setSupported] = useState(true);
  const [dir, setDir] = useState<DirHandle | null>(null);
  const [status, setStatus] = useState("");
  const [count, setCount] = useState(0);
  const seen = useRef<Set<string>>(new Set());
  const busy = useRef(false);

  useEffect(() => {
    setSupported("showDirectoryPicker" in window);
  }, []);

  useEffect(() => {
    if (!dir) return;
    let stopped = false;

    async function scan() {
      if (busy.current || stopped || !dir) return;
      busy.current = true;
      try {
        for await (const entry of dir.values()) {
          if (stopped) break;
          if (entry.kind !== "file" || !IMAGE.test(entry.name)) continue;
          const file = await entry.getFile();
          const key = `${entry.name}:${file.size}:${file.lastModified}`;
          if (seen.current.has(key) || Date.now() - file.lastModified < SETTLE_MS) continue;
          setStatus(`جاري رفع ${entry.name}`);
          try {
            await uploadPhoto(eventId, file, mode);
            seen.current.add(key);
            setCount((c) => c + 1);
            onUploaded();
          } catch (err) {
            console.error(err);
            setStatus(`تعذر رفع ${entry.name}، سنحاول مرة أخرى`);
          }
        }
        if (!stopped) setStatus("بانتظار صور جديدة من الكاميرا...");
      } finally {
        busy.current = false;
      }
    }

    scan();
    const timer = setInterval(scan, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [dir, eventId, mode, onUploaded]);

  async function start(skipExisting: boolean) {
    const picker = (window as unknown as { showDirectoryPicker(): Promise<DirHandle> }).showDirectoryPicker;
    let handle: DirHandle;
    try {
      handle = await picker.call(window);
    } catch {
      return; // user cancelled
    }
    setStatus("تجهيز التعرف على الوجوه...");
    await loadFaceApi();
    seen.current = new Set();
    if (skipExisting) {
      for await (const entry of handle.values()) {
        if (entry.kind === "file" && IMAGE.test(entry.name)) {
          const f = await entry.getFile();
          seen.current.add(`${entry.name}:${f.size}:${f.lastModified}`);
        }
      }
    }
    setCount(0);
    setDir(handle);
  }

  return (
    <section className="card space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold">الرفع المباشر من الكاميرا</h2>
        {dir && (
          <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" /> مباشر
          </span>
        )}
      </div>
      {!supported ? (
        <p className="text-sm text-muted">
          هذه الميزة تعمل على متصفح Chrome أو Edge في الكمبيوتر. افتح هذه الصفحة من أحدهما.
        </p>
      ) : !dir ? (
        <>
          <p className="text-sm text-muted">
            اربط الكاميرا بالكمبيوتر (Wi‑Fi أو كيبل) واجعل برنامجها يحفظ الصور في مجلد، ثم اختر هذا المجلد. كل
            صورة جديدة تُرفع تلقائياً خلال ثوانٍ ويراها الضيوف فوراً.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => start(true)}>
              اختيار مجلد الكاميرا وبدء البث
            </button>
            <button className="btn-ghost" onClick={() => start(false)}>
              بدء البث مع رفع الصور الموجودة
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm">
            المجلد: <b dir="ltr">{dir.name}</b> · رُفعت {count} صورة في هذا البث
          </p>
          <p className="text-sm text-muted">{status}</p>
          <p className="text-xs text-muted">أبقِ هذه الصفحة مفتوحة طوال الحفلة.</p>
          <button className="btn-ghost" onClick={() => setDir(null)}>
            إيقاف البث
          </button>
        </>
      )}
    </section>
  );
}
