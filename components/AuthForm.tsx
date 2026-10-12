"use client";
import { useState } from "react";

// The one sign-in / sign-up form for everyone. After success it goes to `next`,
// or to the account's home (dashboard for photographers and the owner), or
// reloads the page when `stay` is set (e.g. inside the booking page).
export default function AuthForm({
  next,
  stay = false,
  initialMode = "login",
  initialType = "client",
}: {
  next?: string;
  stay?: boolean;
  initialMode?: "login" | "signup";
  initialType?: "client" | "photographer";
}) {
  const [mode, setMode] = useState(initialMode);
  const [type, setType] = useState(initialType);
  const [form, setForm] = useState({ name: "", phone: "", email: "", identifier: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit() {
    const res =
      mode === "login"
        ? await fetch("/api/login", {
            method: "POST",
            body: JSON.stringify({ identifier: form.identifier, password: form.password }),
          })
        : await fetch("/api/account", {
            method: "POST",
            body: JSON.stringify({ action: "register", ...form, photographer: type === "photographer" }),
          });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    // Full page load so the header picks up the new account too.
    if (stay) window.location.reload();
    else window.location.assign(next ?? data.home);
  }

  return (
    <form
      className="card space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await submit();
        } catch (err) {
          setError((err as Error).message || "حدث خطأ، حاول مرة أخرى");
          setBusy(false);
        }
      }}
    >
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-stone-100 p-1">
        {(["signup", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`rounded-lg py-2 text-sm ${mode === m ? "bg-white font-bold text-amber-800 shadow-sm" : "text-muted"}`}
          >
            {m === "signup" ? "حساب جديد" : "تسجيل الدخول"}
          </button>
        ))}
      </div>

      {mode === "login" ? (
        <label className="label">
          رقم الجوال أو البريد
          <input className="input" dir="ltr" autoComplete="username" value={form.identifier} onChange={set("identifier")} required />
        </label>
      ) : (
        <>
          <fieldset className="grid grid-cols-2 gap-2">
            {(
              [
                ["client", "عميل", "أحجز جلسات تصوير"],
                ["photographer", "مصوّر", "أستخدم باركود الحفلات"],
              ] as const
            ).map(([value, title, hint]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-xl border p-3 text-center transition ${
                  type === value ? "border-amber-600 bg-amber-50" : "border-line"
                }`}
              >
                <input type="radio" name="type" className="sr-only" checked={type === value} onChange={() => setType(value)} />
                <span className="block font-bold">{title}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </label>
            ))}
          </fieldset>
          <label className="label">
            الاسم
            <input className="input" autoComplete="name" value={form.name} onChange={set("name")} required />
          </label>
          <label className="label">
            رقم الجوال
            <input className="input" type="tel" dir="ltr" autoComplete="tel" placeholder="05XXXXXXXX" value={form.phone} onChange={set("phone")} required />
          </label>
          <label className="label">
            البريد الإلكتروني (اختياري)
            <input className="input" type="email" dir="ltr" autoComplete="email" value={form.email} onChange={set("email")} />
          </label>
        </>
      )}
      <label className="label">
        كلمة السر
        <input
          className="input"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 6 : undefined}
          value={form.password}
          onChange={set("password")}
          required
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full" disabled={busy}>
        {mode === "signup" ? "إنشاء الحساب" : "دخول"}
      </button>
    </form>
  );
}
