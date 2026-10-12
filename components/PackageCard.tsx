import Link from "next/link";
import type { Package } from "@/lib/studio";

export default function PackageCard({ pkg }: { pkg: Package }) {
  return (
    <div className={`pkg-card ${pkg.featured ? "featured" : ""}`}>
      {pkg.featured && <span className="pkg-badge">الأكثر طلباً</span>}
      <span className="mb-6 block text-3xl">{pkg.icon}</span>
      <div className="mb-2 font-display text-2xl font-bold">{pkg.name}</div>
      <p className="mb-8 text-sm leading-7 text-muted">{pkg.description}</p>
      <div className="mb-8 flex items-baseline gap-1.5">
        <span className="font-display text-4xl font-bold text-gold">{pkg.price.toLocaleString("en-US")}</span>
        <span className="text-sm text-gold">ر.س</span>
        <span className="text-xs text-muted">/ {pkg.unit}</span>
      </div>
      <ul className="pkg-features mb-10 flex-1">
        {pkg.features.map((f) => (
          <li key={f}>
            <span className="text-gold">✦</span>
            {f}
          </li>
        ))}
      </ul>
      <Link href={`/book?package=${pkg.id}`} className="pkg-btn">
        احجز الآن
      </Link>
    </div>
  );
}
