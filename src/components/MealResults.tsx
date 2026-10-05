import type { Result } from "@/lib/data";
import { SLOTS_PER_MEAL } from "@/lib/config";

export function MealResults({ results }: { results: Result[] }) {
  const winners = results.filter((r) => r.guests > 0);
  const taken = winners.reduce((s, r) => s + r.guests, 0);
  if (winners.length === 0) return <p className="text-sm text-neutral-500">No guests for this meal.</p>;
  return (
    <div className="space-y-1">
      <ul className="text-sm">
        {winners.map((r) => (
          <li key={r.email} className="flex justify-between border-b border-neutral-100 py-1 last:border-0">
            <span>{r.name}</span>
            <span className="text-neutral-500">
              {r.guests} {r.guests === 1 ? "guest" : "guests"}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-neutral-500">
        {taken} of {SLOTS_PER_MEAL} guest spots filled
      </p>
    </div>
  );
}
