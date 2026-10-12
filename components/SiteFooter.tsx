import Link from "next/link";
import { site } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white px-4 pb-8 pt-16 md:px-12">
      <div className="mb-12 grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <span className="mb-4 block text-2xl font-extrabold text-amber-700">{site.name}</span>
          <p className="max-w-xs text-sm leading-7 text-muted">{site.description}</p>
        </div>
        <FooterCol
          title="خدماتنا"
          links={[
            ["/packages", "الباقات"],
            ["/book", "احجز جلسة"],
            ["/photographers", "ميزة الباركود للمصورين"],
          ]}
        />
        <FooterCol
          title="الموقع"
          links={[
            ["/", "الرئيسية"],
            ["/gallery", "معرض الأعمال"],
            ["/about", "من نحن"],
          ]}
        />
        <div>
          <h4 className="mb-6 text-sm font-bold text-amber-700">تواصل</h4>
          <ul className="space-y-3 text-sm text-muted">
            <li dir="ltr" className="text-right">{site.phone}</li>
            <li>{site.email}</li>
            <li dir="ltr" className="text-right">{site.instagram}</li>
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8 text-xs text-muted">
        <p>© {new Date().getFullYear()} {site.name} — جميع الحقوق محفوظة</p>
        <Link href="/admin" className="hover:text-gold">
          دخول الإدارة
        </Link>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-6 text-sm font-bold text-amber-700">{title}</h4>
      <ul className="space-y-3">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-muted transition hover:text-gold">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
