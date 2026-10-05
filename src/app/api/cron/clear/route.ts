import { clearDueMeals } from "@/lib/data";

// Backup trigger (see vercel.json). Auctions also run automatically whenever anyone loads a page.
export async function GET(request: Request) {
  if (process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  await clearDueMeals();
  return Response.json({ ok: true });
}
