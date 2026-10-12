"use client";
import { useState } from "react";

export default function BecomePhotographer({ label = "فعّل ميزة الباركود" }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch("/api/account", { method: "POST", body: JSON.stringify({ action: "photographer" }) });
        if (res.ok) window.location.assign("/admin");
        else setBusy(false);
      }}
    >
      {label}
    </button>
  );
}
