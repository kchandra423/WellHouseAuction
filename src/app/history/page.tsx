import { redirect } from "next/navigation";
import { currentEmail } from "@/auth";
import { Card, Notice } from "@/components/ui";
import { clearDueMeals, getMyResults } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { mealLabel, parseMealId } from "@/lib/time";

export default async function HistoryPage() {
  const email = await currentEmail();
  if (!email) redirect("/");
  await clearDueMeals();
  const results = await getMyResults(email);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My history</h1>
      {results.length === 0 && <Notice>You haven&apos;t been in any finished auctions yet.</Notice>}
      <div className="space-y-2">
        {results.map((r) => (
          <Card key={r.mealId} className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{mealLabel(parseMealId(r.mealId)!)}</div>
              <div className="text-sm text-neutral-500">You bid {r.bidAmounts.map(formatMoney).join(", ")}</div>
              {r.trimmed && <div className="text-sm text-amber-800">Some bids were lowered (not enough Well Dollars).</div>}
            </div>
            <div className="text-right">
              {r.guests > 0 ? (
                <>
                  <div className="font-medium text-green-700">
                    Won {r.guests} {r.guests === 1 ? "spot" : "spots"}
                  </div>
                  <div className="text-sm text-neutral-500">Paid {formatMoney(r.payment)}</div>
                </>
              ) : (
                <div className="text-neutral-500">Didn&apos;t win · $0</div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
