import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/store";
import Guest from "./guest";

export const dynamic = "force-dynamic";

export default async function GuestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  return (
    <Guest
      slug={slug}
      eventId={event.id}
      name={event.name}
      retentionDays={event.retentionDays}
      allowBrowseAll={event.allowBrowseAll}
    />
  );
}
