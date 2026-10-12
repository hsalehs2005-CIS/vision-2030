import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getClient, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string; type?: string }>;
}) {
  const { next, mode, type } = await searchParams;
  // Only same-site paths, so the link can't send people elsewhere.
  const target = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;
  const [session, client] = await Promise.all([getSession(), getClient()]);
  if (session) redirect(target ?? "/admin");
  if (client) redirect(target ?? "/account");
  return (
    <section className="section min-h-screen">
      <div className="mx-auto max-w-md">
        <h1 className="section-title text-center">أهلاً بك</h1>
        <p className="mb-8 text-center text-muted">حساب واحد لكل شيء: الحجز، ومتابعة حجوزاتك، وحفلاتك إذا كنت مصوّراً.</p>
        <AuthForm
          next={target}
          initialMode={mode === "signup" ? "signup" : "login"}
          initialType={type === "photographer" ? "photographer" : "client"}
        />
      </div>
    </section>
  );
}
