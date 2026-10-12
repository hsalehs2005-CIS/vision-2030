"use client";
import { useEffect, useState } from "react";
import type { Photographer } from "@/lib/studio";
import { whatsapp } from "./shared";

const STATUS = { pending: "طلب جديد", approved: "مفعّل", rejected: "مرفوض" } as const;

export default function PhotographersTab() {
  const [list, setList] = useState<Photographer[] | null>(null);
  const [issued, setIssued] = useState<{ id: string; password: string } | null>(null);
  const load = async () => setList(await (await fetch("/api/photographers")).json());
  useEffect(() => {
    load();
  }, []);
  if (!list) return null;

  async function act(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/photographers/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });
    const data = await res.json();
    if (data.password) setIssued({ id, password: data.password });
    load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        المصورون يطلبون استخدام ميزة الباركود من صفحة &quot;للمصورين&quot;. عند الموافقة تظهر كلمة سر مرة واحدة، أرسلها للمصوّر مع بريده.
      </p>
      {!list.length && <p className="text-muted">لا توجد طلبات بعد.</p>}
      <ul className="space-y-3">
        {list.map((p) => (
          <li key={p.id} className="card space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-lg font-bold">
                  {p.name}
                  {p.studio && <span className="mr-2 text-sm font-normal text-muted">{p.studio}</span>}
                </div>
                <div className="text-sm text-muted">
                  {p.city && `${p.city} · `}
                  {p.eventCount} حفلة
                </div>
              </div>
              <span className={`border px-2 py-0.5 text-xs ${p.status === "approved" ? "border-gold/60 text-gold" : p.status === "pending" ? "border-amber-400/40 text-amber-300" : "border-line text-muted"}`}>
                {STATUS[p.status]}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <a href={`tel:${p.phone}`} dir="ltr">{p.phone}</a>
              <a href={whatsapp(p.phone)} target="_blank" className="text-gold">واتساب</a>
              <a href={`mailto:${p.email}`} className="text-muted" dir="ltr">{p.email}</a>
            </div>
            {p.message && <p className="whitespace-pre-wrap border-r-2 border-line pr-3 text-sm text-muted">{p.message}</p>}
            {issued?.id === p.id && (
              <div className="border border-gold/40 bg-gold/10 p-3 text-sm">
                بيانات الدخول (تظهر مرة واحدة فقط):
                <div className="mt-1 font-mono" dir="ltr">
                  {p.email} / <b className="text-gold">{issued.password}</b>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
              {p.status !== "approved" && <button className="btn btn-sm" onClick={() => act(p.id, "approve")}>موافقة</button>}
              {p.status === "approved" && <button className="btn-ghost btn-sm" onClick={() => act(p.id, "approve")}>كلمة سر جديدة</button>}
              {p.status !== "rejected" && <button className="btn-ghost btn-sm" onClick={() => act(p.id, "reject")}>{p.status === "approved" ? "إيقاف" : "رفض"}</button>}
              <button
                className="btn-sm mr-auto text-xs text-muted hover:text-red-400"
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
