"use client";

import { useActionState, useState } from "react";
import { placeBidAction, type BidFormState } from "@/app/actions";
import { formatMoney, parseMoney } from "@/lib/money";
import { Button, Notice } from "./ui";

export function BidForm({
  mealId,
  initial,
  balance,
  maxGuests,
}: {
  mealId: string;
  initial: number[];
  balance: number;
  maxGuests: number;
}) {
  const [rows, setRows] = useState<string[]>(initial.length ? initial.map((c) => (c / 100).toFixed(2)) : [""]);
  const [state, formAction, pending] = useActionState<BidFormState, FormData>(placeBidAction, {});

  const parsed = rows.map((r) => (r.trim() === "" ? 0 : parseMoney(r)));
  const invalid = parsed.some((p) => p === null);
  const total = parsed.reduce<number>((s, p) => s + (p ?? 0), 0);
  const overBudget = total > balance;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="mealId" value={mealId} />

      <div className="space-y-2">
        {rows.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            <label htmlFor={`amount-${i}`} className="w-24 shrink-0 text-sm text-neutral-600">
              {rows.length === 1 ? "Your bid" : `Guest ${i + 1}`}
            </label>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400">$</span>
              <input
                id={`amount-${i}`}
                name="amount"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={value}
                onChange={(e) => setRows(rows.map((r, j) => (j === i ? e.target.value : r)))}
                className={`w-full rounded-lg border bg-white py-2.5 pr-3 pl-7 text-lg outline-none focus:ring-2 focus:ring-black ${
                  parsed[i] === null ? "border-red-400" : "border-neutral-300"
                }`}
              />
            </div>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
                className="rounded-lg px-3 py-2 text-neutral-400 hover:bg-neutral-100 hover:text-black"
                aria-label={`Remove guest ${i + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {rows.length < maxGuests && (
        <button type="button" onClick={() => setRows([...rows, ""])} className="text-sm font-medium underline">
          + Bid for another guest
        </button>
      )}

      <div className="text-sm text-neutral-600">
        Total: <span className={overBudget ? "font-semibold text-red-700" : "font-semibold"}>{formatMoney(total)}</span> of{" "}
        {formatMoney(balance)} available
      </div>

      {invalid && <Notice kind="error">Amounts must be numbers like 5 or 2.50.</Notice>}
      {overBudget && <Notice kind="error">That&apos;s more Well Dollars than you have.</Notice>}
      {state.error && <Notice kind="error">{state.error}</Notice>}

      <Button type="submit" disabled={pending || invalid || overBudget} className="w-full text-lg">
        {pending ? "Saving…" : "Save my bid"}
      </Button>
    </form>
  );
}
