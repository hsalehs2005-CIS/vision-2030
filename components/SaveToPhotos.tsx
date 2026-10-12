"use client";
// Saves photos to the phone's camera roll. Websites can't write to Photos
// directly, so this opens the system share sheet with the image files, which
// offers "Save Image" (iPhone) or "Save to device" (Android) in one tap.
import { useEffect, useRef, useState } from "react";
import { downloadUrl } from "@/lib/upload-client";

type Photo = { id: string; fullUrl: string };
type State = "idle" | "preparing" | "ready" | "saved";

async function toFile(p: Photo) {
  const res = await fetch(p.fullUrl);
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return new File([await res.blob()], `photo-${p.id.slice(0, 6)}.jpg`, { type: "image/jpeg" });
}

function canShareFiles() {
  try {
    const probe = new File([""], "probe.jpg", { type: "image/jpeg" });
    return !!navigator.canShare?.({ files: [probe] });
  } catch {
    return false;
  }
}

function downloadAll(photos: Photo[]) {
  for (const p of photos) {
    const a = document.createElement("a");
    a.href = downloadUrl(p.fullUrl);
    a.download = "";
    a.click();
  }
}

export default function SaveToPhotos({
  photos,
  autoPrepare = false,
  className = "btn",
}: {
  photos: Photo[];
  autoPrepare?: boolean;
  className?: string;
}) {
  const [state, setState] = useState<State>("idle");
  const files = useRef<File[] | null>(null);
  const key = photos.map((p) => p.id).join(",");

  async function prepare() {
    setState("preparing");
    try {
      files.current = await Promise.all(photos.map(toFile));
      setState("ready");
    } catch (err) {
      console.error(err);
      files.current = null;
      setState("idle");
      downloadAll(photos);
    }
  }

  // Share must run straight from the tap (iPhone rejects it after a slow fetch),
  // so a single photo is fetched as soon as it is opened.
  useEffect(() => {
    files.current = null;
    setState("idle");
    if (autoPrepare && canShareFiles()) prepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, autoPrepare]);

  async function onClick() {
    if (!canShareFiles()) return downloadAll(photos);
    if (state === "preparing") return;
    if (!files.current) return prepare();
    try {
      await navigator.share({ files: files.current });
      setState("saved");
    } catch (err) {
      if ((err as Error).name !== "AbortError") console.error(err);
    }
  }

  const many = photos.length > 1;
  const label = {
    idle: many ? `حفظ كل الصور (${photos.length})` : "حفظ في الصور",
    preparing: "جاري التجهيز...",
    ready: many ? `اضغط للحفظ (${photos.length})` : "حفظ في الصور",
    saved: "تم ✓ حفظ مرة أخرى",
  }[state];

  return (
    <button className={className} onClick={onClick} disabled={state === "preparing"}>
      {label}
    </button>
  );
}
