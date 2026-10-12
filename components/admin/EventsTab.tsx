"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type EventRow = { id: string; name: string; date: string; slug: string; photoCount: number; photographerId: string | null };

export default function EventsTab({ showOwner }: { showOwner: boolean }) {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const load = async () => setEvents(await (await fetch("/api/events")).json());
  useEffect(() => {
    load();
    if (showOwner) {
      fetch("/api/photographers")
        .then((r) => r.json())
        .then((list: { id: string; name: string }[]) => setNames(Object.fromEntries(list.map((p) => [p.id, p.name]))));
    }
  }, [showOwner]);
  if (!events) return null;

  return (
    <div className="space-y-6">
      <NewEvent onCreated={load} />
      <ul className="space-y-3">
        {events.map((e) => (
          <li key={e.id}>
            <Link href={`/admin/${e.id}`} className="card flex items-center justify-between transition hover:border-gold/50">
              <div>
                <div className="text-lg font-bold">{e.name}</div>
                <div className="text-sm text-muted" dir="ltr" style={{ textAlign: "right" }}>
                  {e.date}
                </div>
                {showOwner && e.photographerId && <div className="text-xs text-gold">المصوّر: {names[e.photographerId] ?? "—"}</div>}
              </div>
              <div className="text-sm text-muted">{e.photoCount} صورة</div>
            </Link>
          </li>
        ))}
        {!events.length && <p className="text-muted">لا توجد حفلات بعد. أنشئ أول حفلة من الأعلى.</p>}
      </ul>
    </div>
  );
}

function NewEvent({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [retentionDays, setRetention] = useState(30);
  const [allowBrowseAll, setBrowseAll] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="card grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await fetch("/api/events", { method: "POST", body: JSON.stringify({ name, date, retentionDays, allowBrowseAll }) });
        setBusy(false);
        setName("");
        onCreated();
      }}
    >
      <h2 className="text-xl font-bold sm:col-span-2">حفلة جديدة (باركود الضيوف)</h2>
      <input className="input sm:col-span-2" placeholder="اسم الحفلة، مثلاً: زواج أحمد وسارة" value={name} onChange={(e) => setName(e.target.value)} required />
      <label className="label">
        تاريخ الحفلة
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="label">
        حذف الصور وبيانات الوجوه بعد
        <select className="input" value={retentionDays} onChange={(e) => setRetention(Number(e.target.value))}>
          {[7, 30, 90, 180].map((d) => (
            <option key={d} value={d}>{d} يوم</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={allowBrowseAll} onChange={(e) => setBrowseAll(e.target.checked)} />
        السماح للضيوف بتصفح كل صور الحفلة بدون سيلفي
      </label>
      <button className="btn sm:col-span-2" disabled={busy}>إنشاء الحفلة</button>
    </form>
  );
}
