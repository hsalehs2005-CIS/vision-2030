"use client";
import { useEffect, useState } from "react";
import { type Booking, fetchBookings, STATUS_CLASS, STATUS_LABEL, whatsapp } from "./shared";

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export default function CalendarTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const today = iso(now.getFullYear(), now.getMonth(), now.getDate());
  const [selected, setSelected] = useState(today);
  useEffect(() => {
    fetchBookings().then((b) => setBookings(b.filter((x) => x.status !== "cancelled")));
  }, []);

  const byDate = new Map<string, Booking[]>();
  for (const b of bookings) byDate.set(b.date, [...(byDate.get(b.date) ?? []), b]);

  const first = new Date(month.y, month.m, 1).getDay();
  const days = new Date(month.y, month.m + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const title = new Date(month.y, month.m, 1).toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { month: "long", year: "numeric" });
  const shift = (n: number) => setMonth(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }));
  const dayList = byDate.get(selected) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <button className="btn-ghost btn-sm" onClick={() => shift(-1)}>→</button>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button className="btn-ghost btn-sm" onClick={() => shift(1)}>←</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
          {DAYS.map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`x${i}`} />;
            const date = iso(month.y, month.m, d);
            const list = byDate.get(date) ?? [];
            const confirmed = list.some((b) => b.status === "confirmed" || b.status === "done");
            return (
              <button
                key={date}
                onClick={() => setSelected(date)}
                className={`flex aspect-square flex-col items-center justify-center gap-1 border text-sm transition ${
                  selected === date ? "border-gold" : "border-line hover:border-gold/40"
                } ${date === today ? "text-gold" : ""} ${confirmed ? "bg-gold/15" : ""}`}
              >
                {d}
                {list.length > 0 && (
                  <span className="flex gap-0.5">
                    {list.slice(0, 3).map((b) => (
                      <span key={b.id} className={`h-1.5 w-1.5 rounded-full ${b.status === "pending" ? "bg-amber-300" : "bg-gold"}`} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gold" /> مؤكد</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-300" /> بانتظار التأكيد</span>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="font-display text-lg font-bold" dir="ltr" style={{ textAlign: "right" }}>{selected}</h3>
        {!dayList.length && <p className="text-sm text-muted">لا مواعيد في هذا اليوم.</p>}
        {dayList.map((b) => (
          <div key={b.id} className="card space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="font-bold">{b.name}</span>
              <span className="text-gold" dir="ltr">{b.time || "—"}</span>
            </div>
            <div className="text-muted">{b.packageName}</div>
            <div className="flex gap-4">
              <a href={`tel:${b.phone}`} dir="ltr">{b.phone}</a>
              <a href={whatsapp(b.phone)} target="_blank" className="text-gold">واتساب</a>
            </div>
            <span className={`inline-block border px-2 py-0.5 text-xs ${STATUS_CLASS[b.status]}`}>{STATUS_LABEL[b.status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
