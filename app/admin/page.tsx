"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import BookingsTab from "@/components/admin/BookingsTab";
import CalendarTab from "@/components/admin/CalendarTab";
import EventsTab from "@/components/admin/EventsTab";
import PackagesTab from "@/components/admin/PackagesTab";
import PhotographersTab from "@/components/admin/PhotographersTab";
import { site } from "@/lib/site";

type Session = { role: "owner" } | { role: "photographer"; id: string; name: string };

const OWNER_TABS = [
  { key: "bookings", label: "الحجوزات" },
  { key: "calendar", label: "جدول المواعيد" },
  { key: "packages", label: "الباقات" },
  { key: "events", label: "الحفلات" },
  { key: "photographers", label: "المصورون" },
] as const;
type Tab = (typeof OWNER_TABS)[number]["key"];

export default function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("bookings");

  async function load() {
    const res = await fetch("/api/login");
    setSession((await res.json()).session);
  }
  useEffect(() => {
    load();
    const saved = sessionStorage.getItem("admin-tab") as Tab | null;
    if (saved) setTab(saved);
  }, []);

  if (session === undefined) return null;
  if (!session) return <Login onDone={load} />;

  const owner = session.role === "owner";
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-ink-2">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-display text-xl font-bold">
            {site.name}
            <span className="mr-2 text-xs font-normal text-gold">{owner ? "لوحة الاستوديو" : `مرحباً ${session.name}`}</span>
          </Link>
          <button
            className="text-sm text-muted hover:text-gold"
            onClick={async () => {
              await fetch("/api/login", { method: "DELETE" });
              setSession(null);
            }}
          >
            خروج
          </button>
        </div>
        {owner && (
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
            {OWNER_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  sessionStorage.setItem("admin-tab", t.key);
                }}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm transition ${
                  tab === t.key ? "border-gold text-gold" : "border-transparent text-muted hover:text-cream"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {!owner || tab === "events" ? (
          <EventsTab showOwner={owner} />
        ) : tab === "bookings" ? (
          <BookingsTab />
        ) : tab === "calendar" ? (
          <CalendarTab />
        ) : tab === "packages" ? (
          <PackagesTab />
        ) : (
          <PhotographersTab />
        )}
      </main>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"owner" | "photographer">("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <Link href="/" className="mb-8 text-center font-display text-3xl font-bold">
        {site.name}
      </Link>
      <form
        className="card space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const body = mode === "owner" ? { password } : { email, password };
          const res = await fetch("/api/login", { method: "POST", body: JSON.stringify(body) });
          if (res.ok) onDone();
          else setError((await res.json()).error);
        }}
      >
        <div className="grid grid-cols-2 gap-1 border border-line p-1">
          {(["owner", "photographer"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`py-2 text-sm ${mode === m ? "bg-gold font-bold text-ink" : "text-muted"}`}
            >
              {m === "owner" ? "صاحب الاستوديو" : "مصوّر"}
            </button>
          ))}
        </div>
        {mode === "photographer" && (
          <input className="input" type="email" dir="ltr" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} required />
        )}
        <input className="input" type="password" placeholder="كلمة السر" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn w-full">دخول</button>
        {mode === "photographer" && (
          <p className="text-center text-xs text-muted">
            ليس لديك حساب؟ <Link href="/photographers" className="text-gold">اطلب الانضمام</Link>
          </p>
        )}
      </form>
    </main>
  );
}
