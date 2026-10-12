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
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  confirmed: "border-amber-600 bg-amber-100 text-amber-900",
  done: "border-emerald-300 bg-emerald-50 text-emerald-800",
  cancelled: "border-stone-200 text-stone-500 line-through",
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
