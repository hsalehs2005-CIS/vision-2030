"use client";
import { useEffect, useState } from "react";
import type { Photographer } from "@/lib/clients";
import { whatsapp } from "./shared";

export default function PhotographersTab() {
  const [list, setList] = useState<Photographer[] | null>(null);
  const [issued, setIssued] = useState<{ id: string; password: string } | null>(null);
  const load = async () => setList(await (await fetch("/api/photographers")).json());
  useEffect(() => {
    load();
  }, []);
  if (!list) return null;

  async function act(id: string, action: "suspend" | "resume" | "reset") {
    const res = await fetch(`/api/photographers/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });
    const data = await res.json();
    if (data.password) setIssued({ id, password: data.password });
    load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        المصورون ينشئون حساباتهم بأنفسهم ويبدأون مباشرة. من هنا تقدر توقف أي حساب أو تحذفه.
      </p>
      {!list.length && <p className="text-muted">لا يوجد مصورون بعد.</p>}
      <ul className="space-y-3">
        {list.map((p) => (
          <li key={p.id} className="card space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-lg font-bold">{p.name}</div>
                <div className="text-sm text-muted">{p.eventCount} حفلة</div>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  p.suspended ? "border-stone-200 text-stone-500" : "border-emerald-300 bg-emerald-50 text-emerald-800"
                }`}
              >
                {p.suspended ? "موقوف" : "نشط"}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <a href={`tel:${p.phone}`} dir="ltr">{p.phone}</a>
              <a href={whatsapp(p.phone)} target="_blank" className="text-gold">واتساب</a>
              {p.email && <a href={`mailto:${p.email}`} className="text-muted" dir="ltr">{p.email}</a>}
            </div>
            {issued?.id === p.id && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
                كلمة السر الجديدة (تظهر مرة واحدة فقط، أرسلها للمصوّر):
                <div className="mt-1 font-mono font-bold text-amber-800" dir="ltr">{issued.password}</div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
              <button className="btn-ghost btn-sm" onClick={() => act(p.id, p.suspended ? "resume" : "suspend")}>
                {p.suspended ? "إعادة التفعيل" : "إيقاف"}
              </button>
              <button className="btn-ghost btn-sm" onClick={() => act(p.id, "reset")}>نسي كلمة السر</button>
              <button
                className="btn-sm mr-auto text-xs text-muted hover:text-red-600"
                onClick={async () => {
                  if (!confirm(`حذف ${p.name} مع كل حفلاته وصورها نهائياً؟`)) return;
                  await fetch(`/api/photographers/${p.id}`, { method: "DELETE" });
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
