"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type EventRow = { id: string; name: string; date: string; slug: string; photoCount: number };

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);

  async function load() {
    const res = await fetch("/api/events");
    if (res.status === 401) return setAuthed(false);
    setAuthed(true);
    setEvents(await res.json());
  }
  useEffect(() => {
    load();
  }, []);

  if (authed === null) return null;
  if (!authed) return <Login onDone={load} />;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">حفلاتي</h1>
        <button
          className="text-sm text-stone-500 underline"
          onClick={async () => {
            await fetch("/api/login", { method: "DELETE" });
            setAuthed(false);
          }}
        >
          خروج
        </button>
      </header>
      <NewEvent onCreated={load} />
      <ul className="space-y-3">
        {events.map((e) => (
          <li key={e.id}>
            <Link href={`/admin/${e.id}`} className="card flex items-center justify-between hover:border-amber-600">
              <div>
                <div className="text-lg font-bold">{e.name}</div>
                <div className="text-sm text-stone-500">{e.date}</div>
              </div>
              <div className="text-sm text-stone-500">{e.photoCount} صورة</div>
            </Link>
          </li>
        ))}
        {!events.length && <p className="text-stone-500">لا توجد حفلات بعد. أنشئ أول حفلة من الأعلى.</p>}
      </ul>
    </main>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <form
        className="card space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/login", { method: "POST", body: JSON.stringify({ password }) });
          if (res.ok) onDone();
          else setError((await res.json()).error);
        }}
      >
        <h1 className="text-2xl font-extrabold">دخول المصوّر</h1>
        <input
          className="input"
          type="password"
          placeholder="كلمة السر"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full">دخول</button>
      </form>
    </main>
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
      className="card grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await fetch("/api/events", {
          method: "POST",
          body: JSON.stringify({ name, date, retentionDays, allowBrowseAll }),
        });
        setBusy(false);
        setName("");
        onCreated();
      }}
    >
      <h2 className="text-xl font-bold sm:col-span-2">حفلة جديدة</h2>
      <input className="input sm:col-span-2" placeholder="اسم الحفلة، مثلاً: زواج أحمد وسارة" value={name} onChange={(e) => setName(e.target.value)} required />
      <label className="text-sm">
        تاريخ الحفلة
        <input className="input mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="text-sm">
        حذف الصور وبيانات الوجوه بعد
        <select className="input mt-1" value={retentionDays} onChange={(e) => setRetention(Number(e.target.value))}>
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
