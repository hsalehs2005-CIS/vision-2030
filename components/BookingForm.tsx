"use client";
import { useState } from "react";

type Option = { id: string; name: string; price: number; unit: string };

const TIMES = ["09:00", "11:00", "13:00", "16:00", "18:00", "20:00"];

export default function BookingForm({
  packages,
  booked,
  initialPackage,
}: {
  packages: Option[];
  booked: string[];
  initialPackage: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ name: "", phone: "", email: "", packageId: initialPackage, date: "", time: "", notes: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const dateTaken = booked.includes(form.date);

  if (state === "done") {
    return (
      <div className="card flex flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="text-5xl">✦</span>
        <h2 className="font-display text-2xl font-bold">تم استلام طلبك</h2>
        <p className="max-w-sm text-sm leading-7 text-muted">
          شكراً {form.name}. سنتواصل معك على <span dir="ltr">{form.phone}</span> لتأكيد موعد {form.date}.
        </p>
      </div>
    );
  }

  return (
    <form
      className="card grid gap-5 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (dateTaken) return;
        setState("sending");
        setError("");
        const res = await fetch("/api/bookings", { method: "POST", body: JSON.stringify(form) });
        if (res.ok) return setState("done");
        setError((await res.json()).error ?? "حدث خطأ، حاول مرة أخرى");
        setState("idle");
      }}
    >
      <label className="label">
        الاسم الكامل *
        <input className="input" value={form.name} onChange={set("name")} required />
      </label>
      <label className="label">
        رقم الجوال *
        <input className="input" type="tel" dir="ltr" placeholder="05XXXXXXXX" value={form.phone} onChange={set("phone")} required />
      </label>
      <label className="label sm:col-span-2">
        البريد الإلكتروني
        <input className="input" type="email" dir="ltr" value={form.email} onChange={set("email")} />
      </label>
      <label className="label sm:col-span-2">
        الباقة
        <select className="input" value={form.packageId} onChange={set("packageId")}>
          <option value="">باقة مخصصة / غير متأكد</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.price.toLocaleString("en-US")} ر.س / {p.unit}
            </option>
          ))}
        </select>
      </label>
      <label className="label">
        التاريخ *
        <input className="input" type="date" min={today} value={form.date} onChange={set("date")} required />
      </label>
      <label className="label">
        الوقت المفضل
        <select className="input" value={form.time} onChange={set("time")}>
          <option value="">أي وقت</option>
          {TIMES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      {dateTaken && <p className="text-sm text-red-400 sm:col-span-2">هذا اليوم محجوز، اختر يوماً آخر.</p>}
      <label className="label sm:col-span-2">
        ملاحظات
        <textarea className="input min-h-28" placeholder="نوع المناسبة، المكان، عدد الأشخاص..." value={form.notes} onChange={set("notes")} />
      </label>
      {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}
      <button className="btn sm:col-span-2" disabled={state === "sending" || dateTaken}>
        {state === "sending" ? "جاري الإرسال..." : "أرسل طلب الحجز"}
      </button>
    </form>
  );
}
