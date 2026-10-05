import { notFound } from "next/navigation";
import { currentEmail } from "@/auth";
import { saveResidentsAction, toggleCancelAction } from "@/app/actions";
import { Button, Card } from "@/components/ui";
import { getCancelledMeals, getResidents, isAdmin } from "@/lib/data";
import { mealLabel, upcomingMeals } from "@/lib/time";

export default async function AdminPage() {
  if (!isAdmin(await currentEmail())) notFound();
  const [residents, cancelled] = await Promise.all([getResidents(), getCancelledMeals()]);
  const meals = upcomingMeals();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <Card className="space-y-3">
        <h2 className="font-semibold">Residents</h2>
        <p className="text-sm text-neutral-600">
          Only these emails can sign in. Paste one per line (or separated by commas).{" "}
          <strong>If this list is empty, anyone with a Stanford email can sign in.</strong> Admins can always sign in.
        </p>
        <form action={saveResidentsAction} className="space-y-2">
          <textarea
            name="residents"
            defaultValue={residents.join("\n")}
            rows={10}
            placeholder={"sunet1@stanford.edu\nsunet2@stanford.edu"}
            className="w-full rounded-lg border border-neutral-300 p-2 font-mono text-sm"
          />
          <Button>Save residents ({residents.length} now)</Button>
        </form>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Cancel a meal</h2>
        <p className="text-sm text-neutral-600">
          Cancelled meals have no guest spots. If the auction already ran, everyone is refunded.
        </p>
        <ul className="divide-y divide-neutral-100">
          {meals.map((m) => {
            const isCancelled = cancelled.has(m.id);
            return (
              <li key={m.id} className="flex items-center justify-between py-2">
                <span className={isCancelled ? "text-neutral-400 line-through" : ""}>{mealLabel(m)}</span>
                <form action={toggleCancelAction}>
                  <input type="hidden" name="mealId" value={m.id} />
                  <input type="hidden" name="cancel" value={isCancelled ? "0" : "1"} />
                  <Button variant={isCancelled ? "secondary" : "danger"} className="py-1 text-sm">
                    {isCancelled ? "Restore" : "Cancel"}
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
