"use client";
import { useRouter } from "next/navigation";
import type { Booking } from "@/lib/studio";
import { STATUS_CLASS, STATUS_LABEL } from "./admin/shared";

export default function AccountBookings({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  return (
    <div className="space-y-3">
      {!bookings.length && <p className="text-muted">ما عندك حجوزات بعد.</p>}
      {bookings.map((b) => (
        <div key={b.id} className="card flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">{b.packageName}</div>
            <div className="text-sm text-gold" dir="ltr" style={{ textAlign: "right" }}>
              {b.date} {b.time}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`border px-2 py-0.5 text-xs ${STATUS_CLASS[b.status]}`}>{STATUS_LABEL[b.status]}</span>
            {b.status === "pending" && (
              <button
                className="text-xs text-muted hover:text-red-600"
                onClick={async () => {
                  if (!confirm("إلغاء طلب الحجز؟")) return;
                  await fetch(`/api/account/bookings/${b.id}`, { method: "DELETE" });
                  router.refresh();
                }}
              >
                إلغاء
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        className="mt-8 text-sm text-muted hover:text-gold"
        onClick={async () => {
          await fetch("/api/login", { method: "DELETE" });
          window.location.assign("/");
        }}
      >
        تسجيل الخروج
      </button>
    </div>
  );
}
