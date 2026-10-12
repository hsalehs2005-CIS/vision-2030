"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";

const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/packages", label: "الباقات" },
  { href: "/gallery", label: "معرض" },
  { href: "/about", label: "عنّا" },
  { href: "/photographers", label: "للمصورين" },
];

export default function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState({ href: "/login", label: "دخول / حساب جديد" });
  useEffect(() => {
    fetch("/api/login")
      .then((r) => r.json())
      .then((d) => {
        if (d.client) setAccount({ href: "/account", label: "حسابي" });
        else if (d.session) setAccount({ href: "/admin", label: "لوحة الاستوديو" });
        else setAccount({ href: "/login", label: "دخول / حساب جديد" });
      })
      .catch(() => {});
  }, [path]);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-4 md:px-12">
        <Link href="/" className="leading-none" onClick={() => setOpen(false)}>
          <span className="text-2xl font-extrabold text-amber-700">{site.name}</span>
          <span className="block text-xs text-stone-500">{site.tagline}</span>
        </Link>
        <ul className="hidden gap-10 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`text-sm tracking-wide transition hover:text-gold ${path === l.href ? "text-gold" : "text-muted"}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <Link href={account.href} className="hidden text-sm text-cream transition hover:text-gold md:block">
            {account.label}
          </Link>
          <Link href="/book" className="btn px-5 py-2.5" onClick={() => setOpen(false)}>
            احجز الآن
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-cream md:hidden"
            aria-label="القائمة"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <ul className="border-t border-line px-4 pb-4 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block border-b border-line py-3 ${path === l.href ? "text-gold" : "text-cream"}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href={account.href} onClick={() => setOpen(false)} className="block py-3 text-gold">
              {account.label}
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
}
