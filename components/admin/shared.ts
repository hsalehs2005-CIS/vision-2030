export type Booking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  packageName: string;
  price: number | null;
  date: string;
  time: string;
  notes: string;
  status: "pending" | "confirmed" | "done" | "cancelled";
  createdAt: string;
};

export const STATUS_LABEL: Record<Booking["status"], string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد",
  done: "تم التصوير",
  cancelled: "ملغي",
};

export const STATUS_CLASS: Record<Booking["status"], string> = {
  pending: "border-amber-400/40 text-amber-300",
  confirmed: "border-gold/60 text-gold",
  done: "border-emerald-400/40 text-emerald-300",
  cancelled: "border-line text-muted line-through",
};

export async function fetchBookings(): Promise<Booking[]> {
  const res = await fetch("/api/bookings");
  return res.ok ? res.json() : [];
}

// Saudi numbers like 05XXXXXXXX become 9665XXXXXXXX for WhatsApp links.
export function whatsapp(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("05")) digits = `966${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}
