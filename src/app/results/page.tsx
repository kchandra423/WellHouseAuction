import { redirect } from "next/navigation";
import { currentEmail } from "@/auth";
import { MealResults } from "@/components/MealResults";
import { Card, Notice } from "@/components/ui";
import { clearDueMeals, getClearedMealIds, getResults } from "@/lib/data";
import { compareMealIds, mealLabel, parseMealId, todayInDorm } from "@/lib/time";

export default async function ResultsPage() {
  if (!(await currentEmail())) redirect("/");
  await clearDueMeals();

  const today = todayInDorm();
  const cleared = [...(await getClearedMealIds())].sort(compareMealIds);
  const upcoming = cleared.filter((id) => id.slice(0, 10) >= today);
  const recent = cleared.filter((id) => id.slice(0, 10) < today).reverse().slice(0, 10);
  const results = await getResults([...upcoming, ...recent]);

  const section = (title: string, ids: string[]) => (
    <section className="space-y-2">
      <h2 className="font-semibold">{title}</h2>
      {ids.map((id) => (
        <Card key={id} className="space-y-2">
          <div className="font-medium">{mealLabel(parseMealId(id)!)}</div>
          <MealResults results={results.get(id) ?? []} />
        </Card>
      ))}
    </section>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Who&apos;s bringing guests</h1>
      {upcoming.length === 0 && recent.length === 0 && <Notice>No auctions have finished yet.</Notice>}
      {upcoming.length > 0 && section("Coming up", upcoming)}
      {recent.length > 0 && section("Recent meals", recent)}
    </div>
  );
}
