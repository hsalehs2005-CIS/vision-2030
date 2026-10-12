"use client";
import { useState } from "react";

// Client sign-in / sign-up. After success it goes to `next`, or refreshes the current page.
export default function ClientAuth({ next, initialMode = "register" }: { next?: string; initialMode?: "login" | "register" }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  return (
    <form
      className="card space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const res = await fetch("/api/account", { method: "POST", body: JSON.stringify({ action: mode, ...form }) });
        // Full page load so the header picks up the new account too.
        if (res.ok) return next ? window.location.assign(next) : window.location.reload();
        setError((await res.json()).error);
        setBusy(false);
      }}
    >
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-stone-100 p-1">
        {(["register", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg py-2 text-sm ${mode === m ? "bg-white font-bold text-amber-800 shadow-sm" : "text-muted"}`}
          >
            {m === "register" ? "حساب جديد" : "تسجيل الدخول"}
          </button>
        ))}
      </div>
      {mode === "register" && (
        <label className="label">
          الاسم الكامل
          <input className="input" value={form.name} onChange={set("name")} required />
        </label>
      )}
      <label className="label">
        رقم الجوال
        <input className="input" type="tel" dir="ltr" placeholder="05XXXXXXXX" value={form.phone} onChange={set("phone")} required />
      </label>
      {mode === "register" && (
        <label className="label">
          البريد الإلكتروني (اختياري)
          <input className="input" type="email" dir="ltr" value={form.email} onChange={set("email")} />
        </label>
      )}
      <label className="label">
        كلمة السر
        <input className="input" type="password" minLength={mode === "register" ? 6 : undefined} value={form.password} onChange={set("password")} required />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full" disabled={busy}>
        {mode === "register" ? "إنشاء الحساب" : "دخول"}
      </button>
    </form>
  );
}
