"use client";
import { useState } from "react";

export default function PhotographerRequestForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", studio: "", city: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  if (state === "done") {
    return (
      <div className="card py-12 text-center">
        <span className="text-4xl text-gold">✦</span>
        <h3 className="mt-3 font-display text-xl font-bold">وصلنا طلبك</h3>
        <p className="mt-2 text-sm text-muted">سنراجع الطلب ونرسل لك بيانات الدخول عند الموافقة.</p>
      </div>
    );
  }

  return (
    <form
      className="card grid gap-5 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        setError("");
        const res = await fetch("/api/photographers", { method: "POST", body: JSON.stringify(form) });
        if (res.ok) return setState("done");
        setError((await res.json()).error ?? "حدث خطأ، حاول مرة أخرى");
        setState("idle");
      }}
    >
      <label className="label">
        الاسم *
        <input className="input" value={form.name} onChange={set("name")} required />
      </label>
      <label className="label">
        رقم الجوال *
        <input className="input" type="tel" dir="ltr" value={form.phone} onChange={set("phone")} required />
      </label>
      <label className="label sm:col-span-2">
        البريد الإلكتروني * (يُستخدم لتسجيل الدخول)
        <input className="input" type="email" dir="ltr" value={form.email} onChange={set("email")} required />
      </label>
      <label className="label">
        اسم الاستوديو
        <input className="input" value={form.studio} onChange={set("studio")} />
      </label>
      <label className="label">
        المدينة
        <input className="input" value={form.city} onChange={set("city")} />
      </label>
      <label className="label sm:col-span-2">
        نبذة أو حساب انستقرام
        <textarea className="input min-h-24" value={form.message} onChange={set("message")} />
      </label>
      {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}
      <button className="btn sm:col-span-2" disabled={state === "sending"}>
        {state === "sending" ? "جاري الإرسال..." : "أرسل الطلب"}
      </button>
    </form>
  );
}
