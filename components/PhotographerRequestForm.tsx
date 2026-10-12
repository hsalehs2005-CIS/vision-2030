"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Status = "pending" | "approved" | "rejected";

export default function PhotographerRequestForm({ initial }: { initial: { name: string; status: Status } | null }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", studio: "", city: "", message: "" });
  const [status, setStatus] = useState<Status | null>(initial?.status ?? null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const name = initial?.name ?? form.name;
  const box = useRef<HTMLDivElement>(null);

  // Keep the status card in view when it replaces the form.
  useEffect(() => {
    if (status && status !== initial?.status) box.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [status, initial?.status]);

  // While waiting, check now and then so the dashboard button appears as soon as the studio approves.
  useEffect(() => {
    if (status !== "pending") return;
    const timer = setInterval(async () => {
      const { session } = await (await fetch("/api/login")).json();
      if (session?.role === "photographer") setStatus("approved");
    }, 10000);
    return () => clearInterval(timer);
  }, [status]);

  if (status === "approved") {
    return (
      <div ref={box} className="card space-y-5 py-12 text-center">
        <span className="text-4xl text-gold">✦</span>
        <h3 className="font-display text-2xl font-bold">أهلاً {name}، تمت الموافقة</h3>
        <p className="text-sm text-muted">من لوحتك تنشئ حفلاتك وترفع الصور وتطبع باركود الضيوف.</p>
        <Link href="/admin" className="btn">ادخل لوحة حفلاتك</Link>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div ref={box} className="card space-y-3 py-12 text-center">
        <span className="text-4xl text-gold">⏳</span>
        <h3 className="font-display text-xl font-bold">طلبك عند الاستوديو للمراجعة</h3>
        <p className="text-sm leading-7 text-muted">
          بمجرد الموافقة يظهر لك هنا زر الدخول للوحتك. تقدر تقفل الصفحة وترجع لها لاحقاً من نفس الجهاز، أو تدخل من أي جهاز ببريدك وكلمة السر.
        </p>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="card py-12 text-center text-sm text-muted">
        لم تتم الموافقة على طلبك. للاستفسار تواصل مع الاستوديو.
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-6 font-display text-2xl font-bold">طلب الانضمام</h2>
      <form
        className="card grid gap-5 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setSending(true);
          setError("");
          const res = await fetch("/api/photographers", { method: "POST", body: JSON.stringify(form) });
          const data = await res.json();
          setSending(false);
          if (res.ok) setStatus(data.status);
          else setError(data.error ?? "حدث خطأ، حاول مرة أخرى");
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
        <label className="label">
          البريد الإلكتروني *
          <input className="input" type="email" dir="ltr" value={form.email} onChange={set("email")} required />
        </label>
        <label className="label">
          كلمة سر لحسابك *
          <input className="input" type="password" minLength={6} value={form.password} onChange={set("password")} required />
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
        <button className="btn sm:col-span-2" disabled={sending}>
          {sending ? "جاري الإرسال..." : "أرسل الطلب"}
        </button>
        <p className="text-center text-xs text-muted sm:col-span-2">
          عندك حساب؟ <Link href="/admin" className="text-gold">سجّل دخولك</Link>
        </p>
      </form>
    </>
  );
}
