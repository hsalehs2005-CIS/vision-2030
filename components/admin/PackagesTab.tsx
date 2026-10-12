"use client";
import { useEffect, useState } from "react";
import type { Package } from "@/lib/studio";

const EMPTY: Omit<Package, "id"> = {
  name: "",
  description: "",
  icon: "📸",
  price: 0,
  unit: "جلسة",
  features: [],
  featured: false,
  active: true,
  sort: 0,
};

export default function PackagesTab() {
  const [packages, setPackages] = useState<Package[] | null>(null);
  const [editing, setEditing] = useState<Package | (typeof EMPTY & { id?: undefined }) | null>(null);
  const load = async () => setPackages(await (await fetch("/api/packages?all")).json());
  useEffect(() => {
    load();
  }, []);
  if (!packages) return null;

  if (editing) {
    return (
      <PackageForm
        initial={editing}
        onDone={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">الباقات الظاهرة تُعرض في صفحة الباقات وفي نموذج الحجز.</p>
        <button className="btn btn-sm" onClick={() => setEditing({ ...EMPTY, sort: packages.length + 1 })}>+ باقة جديدة</button>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {packages.map((p) => (
          <li key={p.id} className={`card space-y-2 ${p.active ? "" : "opacity-50"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <div className="font-bold">
                    {p.name}
                    {p.featured && <span className="mr-2 text-xs text-gold">الأكثر طلباً</span>}
                    {!p.active && <span className="mr-2 text-xs text-muted">مخفية</span>}
                  </div>
                  <div className="text-sm text-gold">
                    {p.price.toLocaleString("en-US")} ر.س / {p.unit}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost btn-sm" onClick={() => setEditing(p)}>تعديل</button>
                <button
                  className="btn-sm text-xs text-muted hover:text-red-600"
                  onClick={async () => {
                    if (!confirm(`حذف باقة ${p.name}؟ الحجوزات السابقة تبقى محفوظة.`)) return;
                    await fetch(`/api/packages/${p.id}`, { method: "DELETE" });
                    load();
                  }}
                >
                  حذف
                </button>
              </div>
            </div>
            <p className="text-sm text-muted">{p.description}</p>
            <p className="text-xs text-muted">{p.features.join(" · ")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PackageForm({ initial, onDone }: { initial: Omit<Package, "id"> & { id?: string }; onDone: () => void }) {
  const [p, setP] = useState({ ...initial, featuresText: initial.features.join("\n") });
  const [error, setError] = useState("");
  const set = (k: string) => (e: { target: { value: string } }) => setP({ ...p, [k]: e.target.value });

  return (
    <form
      className="card mx-auto grid max-w-2xl gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const { featuresText, ...rest } = p;
        const body = { ...rest, features: featuresText.split("\n") };
        const res = await fetch(initial.id ? `/api/packages/${initial.id}` : "/api/packages", {
          method: initial.id ? "PUT" : "POST",
          body: JSON.stringify(body),
        });
        if (res.ok) onDone();
        else setError((await res.json()).error);
      }}
    >
      <h2 className="text-xl font-bold sm:col-span-2">{initial.id ? "تعديل الباقة" : "باقة جديدة"}</h2>
      <label className="label">
        اسم الباقة *
        <input className="input" value={p.name} onChange={set("name")} required />
      </label>
      <label className="label">
        أيقونة (إيموجي)
        <input className="input" value={p.icon} onChange={set("icon")} />
      </label>
      <label className="label">
        السعر (ريال) *
        <input className="input" type="number" min={0} dir="ltr" value={p.price} onChange={set("price")} required />
      </label>
      <label className="label">
        لكل
        <input className="input" placeholder="جلسة، مناسبة، ساعة" value={p.unit} onChange={set("unit")} />
      </label>
      <label className="label sm:col-span-2">
        وصف قصير
        <input className="input" value={p.description} onChange={set("description")} />
      </label>
      <label className="label sm:col-span-2">
        المميزات (كل ميزة في سطر)
        <textarea className="input min-h-36" value={p.featuresText} onChange={set("featuresText")} />
      </label>
      <label className="label">
        الترتيب
        <input className="input" type="number" dir="ltr" value={p.sort} onChange={set("sort")} />
      </label>
      <div className="flex flex-col justify-end gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={p.featured} onChange={(e) => setP({ ...p, featured: e.target.checked })} />
          تمييزها كـ "الأكثر طلباً"
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} />
          ظاهرة للعملاء
        </label>
      </div>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button className="btn flex-1">حفظ</button>
        <button type="button" className="btn-ghost" onClick={onDone}>إلغاء</button>
      </div>
    </form>
  );
}
