import Link from "next/link";
import { redirect } from "next/navigation";
import ClientAuth from "@/components/ClientAuth";
import { getClient } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only same-site paths, so the link can't send people elsewhere.
  const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (await getClient()) redirect(target);
  return (
    <section className="section min-h-screen">
      <div className="mx-auto max-w-md">
        <span className="section-label">حسابي</span>
        <h1 className="section-title">
          أهلاً<span className="accent"> بك</span>
        </h1>
        <div className="divider" />
        <p className="mb-8 text-sm text-muted">أنشئ حسابك لتحجز جلستك وتتابع حالة حجوزاتك.</p>
        <ClientAuth next={target} />
        <div className="mt-8 space-y-2 text-center text-sm text-muted">
          <p>
            مصوّر؟ <Link href="/admin" className="text-gold">دخول المصورين</Link> أو{" "}
            <Link href="/photographers" className="text-gold">أنشئ حساب مصوّر</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
