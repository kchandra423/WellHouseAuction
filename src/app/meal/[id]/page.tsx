import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentEmail } from "@/auth";
import { removeBidAction } from "@/app/actions";
import { BidForm } from "@/components/BidForm";
import { MealResults } from "@/components/MealResults";
import { Button, Card, Notice } from "@/components/ui";
import { clearDueMeals, getBalance, getCancelledMeals, getMyBids, getRecentPrices, getResults } from "@/lib/data";
import { SLOTS_PER_MEAL } from "@/lib/config";
import { formatMoney } from "@/lib/money";
import { closeLabel, isOpen, mealLabel, parseMealId, quarterFor, weeksLeft, type Meal } from "@/lib/time";

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
        <OpenMeal meal={meal} email={email} />
      ) : (
        <ClosedMeal mealId={meal.id} email={email} />
      )}
    </div>
  );
}

async function OpenMeal({ meal, email }: { meal: Meal; email: string }) {
  const quarter = quarterFor(meal.date)!;
  const [balance, bids, history] = await Promise.all([getBalance(email, quarter), getMyBids(email), getRecentPrices(meal.type)]);
  const existing = bids.get(meal.id) ?? [];
  const closes = closeLabel(meal.closesAt);
  return (
    <>
      <p className="text-neutral-600">
        Bidding closes <strong>{closes}</strong>. You can change your bid until then.{" "}
        <Link href="/how-it-works" className="underline">How it works</Link>
      </p>
      <Card>
        <BidForm
          mealId={meal.id}
          mealType={meal.type}
          initial={existing}
          balance={balance}
          maxGuests={SLOTS_PER_MEAL}
          weeksLeft={weeksLeft(quarter)}
          history={history}
        />
      </Card>
      {existing.length > 0 && (
        <form action={removeBidAction}>
          <input type="hidden" name="mealId" value={meal.id} />
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
