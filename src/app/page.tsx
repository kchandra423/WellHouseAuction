import Link from "next/link";
import { currentEmail } from "@/auth";
import { SignIn } from "@/components/SignIn";
import { Badge, ButtonLink, Card, Notice } from "@/components/ui";
import { clearDueMeals, getBalance, getCancelledMeals, getMyBids, getMyResults } from "@/lib/data";
import { STARTING_BALANCE } from "@/lib/config";
import { formatMoney } from "@/lib/money";
import { closeLabel, currentQuarter, isOpen, mealDayLabel, mealLabel, parseMealId, todayInDorm, upcomingMeals } from "@/lib/time";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const email = await currentEmail();
  if (!email) return <SignIn error={typeof params.error === "string" ? params.error : undefined} />;

  await clearDueMeals();
  const quarter = currentQuarter();
  if (!quarter) {
    return <Notice>There are no quarters set up right now. Check back later!</Notice>;
  }

  const [balance, myBids, myResults, cancelled] = await Promise.all([
    getBalance(email, quarter),
    getMyBids(email),
    getMyResults(email),
    getCancelledMeals(),
  ]);

  const today = todayInDorm();
  const openMeals = upcomingMeals().filter((m) => isOpen(m));
  const myUpcomingGuests = myResults.filter((r) => r.guests > 0 && r.mealId.slice(0, 10) >= today).reverse();

  const days = new Map<string, typeof openMeals>();
  for (const m of openMeals) days.set(m.date, [...(days.get(m.date) ?? []), m]);

  const saved = typeof params.saved === "string" ? parseMealId(params.saved) : null;
  const removed = typeof params.removed === "string" ? parseMealId(params.removed) : null;

  return (
    <div className="space-y-6">
      {saved && <Notice kind="success">Your bid for {mealLabel(saved)} is saved. You can change it until bidding closes.</Notice>}
      {removed && <Notice kind="success">Your bid for {mealLabel(removed)} was removed.</Notice>}

      <Card>
        <div className="text-sm text-neutral-500">Your Well Dollars ({quarter.name})</div>
        <div className="text-4xl font-semibold">{formatMoney(balance)}</div>
        <div className="mt-1 text-sm text-neutral-500">
          out of {formatMoney(STARTING_BALANCE * 100)}.{" "}
          <Link href="/how-it-works" className="underline">How does this work?</Link>
        </div>
      </Card>

      {myUpcomingGuests.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">You&apos;re bringing guests to</h2>
          {myUpcomingGuests.map((r) => (
            <Card key={r.mealId} className="flex items-center justify-between bg-green-50">
              <div>
                <div className="font-medium">{mealLabel(parseMealId(r.mealId)!)}</div>
                <div className="text-sm text-neutral-600">
                  {r.guests} {r.guests === 1 ? "guest" : "guests"} · paid {formatMoney(r.payment)}
                </div>
              </div>
              <Badge tone="green">You won!</Badge>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Open auctions</h2>
          <p className="text-sm text-neutral-500">Pick a meal to bid on. Bidding for each meal closes at 8pm the night before.</p>
        </div>
        {days.size === 0 && <Notice>No meals are open for bidding right now.</Notice>}
        {[...days].map(([date, meals]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-sm font-medium text-neutral-500">{mealDayLabel(date)}</h3>
            {meals.map((m) => {
              const bid = myBids.get(m.id);
              const isCancelled = cancelled.has(m.id);
              return (
                <Card key={m.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{m.type === "lunch" ? "Lunch" : "Dinner"}</div>
                    <div className="text-sm text-neutral-500">
                      {isCancelled ? "No guests this meal" : `Closes ${closeLabel(m.closesAt)}`}
                    </div>
                    {bid && !isCancelled && (
                      <div className="mt-1 text-sm">
                        <Badge tone="yellow">
                          You bid for {bid.length} {bid.length === 1 ? "guest" : "guests"}: {bid.map(formatMoney).join(", ")}
                        </Badge>
                      </div>
                    )}
                  </div>
                  {isCancelled ? (
                    <Badge tone="red">Cancelled</Badge>
                  ) : (
                    <ButtonLink href={`/meal/${m.id}`} variant={bid ? "secondary" : "primary"} className="shrink-0">
                      {bid ? "Change bid" : "Bid"}
                    </ButtonLink>
                  )}
                </Card>
              );
            })}
          </div>
        ))}
      </section>
    </div>
  );
}
