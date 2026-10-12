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
  const [pending, setPending] = useState<Partial<Record<Tab, number>>>({});

  async function load() {
    const res = await fetch("/api/login");
    const { session } = await res.json();
    // One sign-in page for everyone; it brings people back here.
    if (!session) window.location.replace("/login?next=/admin");
    else setSession(session);
  }
  useEffect(() => {
    load();
    const saved = sessionStorage.getItem("admin-tab") as Tab | null;
    if (saved) setTab(saved);
  }, []);

  // New booking requests show as a number on their tab.
  useEffect(() => {
    if (session?.role !== "owner") return;
    const count = (url: string) =>
      fetch(url)
        .then((r) => r.json())
        .then((list: { status: string }[]) => list.filter((x) => x.status === "pending").length);
    count("/api/bookings").then((bookings) => setPending({ bookings }));
  }, [session, tab]);

  if (session === undefined) return null;
  if (!session) return null;

  const owner = session.role === "owner";
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-ink-2">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-display text-xl font-bold">
            {site.name}
            <span className="mr-2 text-xs font-normal text-gold">{owner ? "لوحة الاستوديو" : `مرحباً ${session.name}`}</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {!owner && (
              <Link href="/account" className="text-muted hover:text-gold">
                حسابي
              </Link>
            )}
            <button
              className="text-muted hover:text-gold"
              onClick={async () => {
                await fetch("/api/login", { method: "DELETE" });
                window.location.assign("/");
              }}
            >
              خروج
            </button>
          </div>
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
                {!!pending[t.key] && (
                  <span className="mr-1.5 rounded-full bg-gold px-1.5 text-[11px] font-bold text-ink">{pending[t.key]}</span>
                )}
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
