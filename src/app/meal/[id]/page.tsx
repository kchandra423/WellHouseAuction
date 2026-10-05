import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentEmail } from "@/auth";
import { removeBidAction } from "@/app/actions";
import { BidForm } from "@/components/BidForm";
import { MealResults } from "@/components/MealResults";
import { Button, Card, Notice } from "@/components/ui";
import { clearDueMeals, getBalance, getCancelledMeals, getMyBids, getResults } from "@/lib/data";
import { SLOTS_PER_MEAL } from "@/lib/config";
import { formatMoney } from "@/lib/money";
import { closeLabel, isOpen, mealLabel, parseMealId, quarterFor } from "@/lib/time";

export default async function MealPage({ params }: PageProps<"/meal/[id]">) {
  const { id } = await params;
  const meal = parseMealId(id);
  if (!meal) notFound();
  const email = await currentEmail();
  if (!email) redirect("/");

  await clearDueMeals();
  const cancelled = (await getCancelledMeals()).has(meal.id);
  const open = isOpen(meal);

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-neutral-500 hover:text-black">← Back to all meals</Link>
      <h1 className="text-2xl font-semibold">{mealLabel(meal)}</h1>

      {cancelled ? (
        <Notice kind="error">There are no guest spots for this meal. Any bids were refunded.</Notice>
      ) : open ? (
        <OpenMeal mealId={meal.id} email={email} closes={closeLabel(meal.closesAt)} quarterDate={meal.date} />
      ) : (
        <ClosedMeal mealId={meal.id} email={email} />
      )}
    </div>
  );
}

async function OpenMeal({ mealId, email, closes, quarterDate }: { mealId: string; email: string; closes: string; quarterDate: string }) {
  const [balance, bids] = await Promise.all([getBalance(email, quarterFor(quarterDate)!), getMyBids(email)]);
  const existing = bids.get(mealId) ?? [];
  return (
    <>
      <p className="text-neutral-600">
        Bidding closes <strong>{closes}</strong>. You can change your bid as many times as you want until then.
      </p>
      <Card className="space-y-2 bg-blue-50 text-sm text-blue-950">
        <p className="font-medium">How much should I bid?</p>
        <p>
          Enter the <strong>most you&apos;d honestly pay</strong> for each guest. You&apos;ll never pay more than that, and
          usually you&apos;ll pay less.
        </p>
        <p>
          There&apos;s no trick: bidding exactly what it&apos;s worth to you is always your best move. Bidding $0 is fine too —
          if fewer than {SLOTS_PER_MEAL} guests are wanted, you get a spot for free.
        </p>
        <Link href="/how-it-works" className="underline">More details</Link>
      </Card>
      <Card>
        <BidForm mealId={mealId} initial={existing} balance={balance} maxGuests={SLOTS_PER_MEAL} />
      </Card>
      {existing.length > 0 && (
        <form action={removeBidAction}>
          <input type="hidden" name="mealId" value={mealId} />
          <Button variant="danger" className="w-full">Remove my bid</Button>
        </form>
      )}
    </>
  );
}

async function ClosedMeal({ mealId, email }: { mealId: string; email: string }) {
  const results = (await getResults([mealId])).get(mealId) ?? [];
  const mine = results.find((r) => r.email === email);
  return (
    <>
      <Notice>Bidding for this meal is closed.</Notice>
      {mine && (
        <Card className={mine.guests > 0 ? "bg-green-50" : ""}>
          {mine.guests > 0 ? (
            <>
              <p className="font-medium">
                You won {mine.guests} {mine.guests === 1 ? "guest spot" : "guest spots"} and paid {formatMoney(mine.payment)}.
              </p>
              {mine.guests > 1 && (
                <p className="text-sm text-neutral-600">
                  Per guest: {mine.unitPrices.map(formatMoney).join(" + ")}
                </p>
              )}
            </>
          ) : (
            <p>Your bid didn&apos;t win this time. You weren&apos;t charged anything.</p>
          )}
          {mine.trimmed && (
            <p className="mt-2 text-sm text-amber-800">
              Some of your bids were lowered because you didn&apos;t have enough Well Dollars left when this auction ran.
            </p>
          )}
        </Card>
      )}
      <MealResults results={results} />
    </>
  );
}
