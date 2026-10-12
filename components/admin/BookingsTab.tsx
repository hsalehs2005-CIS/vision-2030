"use client";
import { useEffect, useState } from "react";
import { type Booking, fetchBookings, STATUS_CLASS, STATUS_LABEL, whatsapp } from "./shared";

const FILTERS = [
  { key: "upcoming", label: "القادمة" },
  { key: "pending", label: "بانتظار التأكيد" },
  { key: "all", label: "الكل" },
] as const;

export default function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("upcoming");
  const load = () => fetchBookings().then(setBookings);
  useEffect(() => {
    load();
  }, []);
  if (!bookings) return null;

  const today = new Date().toISOString().slice(0, 10);
  const shown = bookings
    .filter((b) =>
      filter === "all" ? true : filter === "pending" ? b.status === "pending" : b.date >= today && b.status !== "cancelled",
    )
    .sort((a, b) => (filter === "all" ? 0 : a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
  const pending = bookings.filter((b) => b.status === "pending").length;

  async function setStatus(id: string, status: Booking["status"]) {
    await fetch(`/api/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="كل الحجوزات" value={bookings.length} />
        <Stat label="بانتظار التأكيد" value={pending} />
        <Stat label="مواعيد قادمة" value={bookings.filter((b) => b.date >= today && b.status === "confirmed").length} />
      </div>
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`pill ${filter === f.key ? "!border-gold !text-gold" : ""}`}>
            {f.label}
          </button>
        ))}
      </div>
      {!shown.length && <p className="text-muted">لا توجد حجوزات هنا.</p>}
      <ul className="space-y-3">
        {shown.map((b) => (
          <li key={b.id} className="card space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold">{b.name}</div>
                <div className="text-sm text-muted">
                  {b.packageName}
                  {b.price != null && ` · ${b.price.toLocaleString("en-US")} ر.س`}
                </div>
              </div>
              <div className="text-left">
                <div className="font-display text-lg text-gold" dir="ltr">
                  {b.date} {b.time}
                </div>
                <span className={`inline-block border px-2 py-0.5 text-xs ${STATUS_CLASS[b.status]}`}>{STATUS_LABEL[b.status]}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <a href={`tel:${b.phone}`} className="text-cream hover:text-gold" dir="ltr">{b.phone}</a>
              <a href={whatsapp(b.phone)} target="_blank" className="text-gold">واتساب</a>
              {b.email && <a href={`mailto:${b.email}`} className="text-muted hover:text-gold" dir="ltr">{b.email}</a>}
            </div>
            {b.notes && <p className="whitespace-pre-wrap border-r-2 border-line pr-3 text-sm text-muted">{b.notes}</p>}
            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
              {b.status !== "confirmed" && <button className="btn btn-sm" onClick={() => setStatus(b.id, "confirmed")}>تأكيد الموعد</button>}
              {b.status === "confirmed" && <button className="btn-ghost btn-sm" onClick={() => setStatus(b.id, "done")}>تم التصوير</button>}
              {b.status !== "cancelled" && <button className="btn-ghost btn-sm" onClick={() => setStatus(b.id, "cancelled")}>إلغاء</button>}
              <button
                className="btn-sm mr-auto text-xs text-muted hover:text-red-400"
                onClick={async () => {
                  if (!confirm(`حذف حجز ${b.name} نهائياً؟`)) return;
                  await fetch(`/api/bookings/${b.id}`, { method: "DELETE" });
                  load();
                }}
              >
                حذف
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <div className="font-display text-3xl font-bold text-gold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
