import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-4 py-16">
      <div>
        <p className="font-bold text-amber-700">صور الحفلة</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight">
          صورة سيلفي واحدة، وتظهر لك كل صورك من الحفلة
        </h1>
        <p className="mt-4 text-lg text-stone-600">
          المصوّر يرفع الصور أثناء الحفلة، والضيف يصوّر الباركود ويلتقط سيلفي، فتظهر له الصور التي
          يظهر فيها فقط.
        </p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-3">
        {["صوّر الباركود", "التقط سيلفي", "حمّل صورك"].map((s, i) => (
          <li key={s} className="card text-center">
            <div className="text-3xl font-extrabold text-amber-700">{i + 1}</div>
            <div className="mt-1 font-bold">{s}</div>
          </li>
        ))}
      </ol>
      <Link href="/admin" className="btn self-start">
        دخول المصوّر
      </Link>
    </main>
  );
}
