import { bookedDates } from "@/lib/studio";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await bookedDates());
}
