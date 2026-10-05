"use client";

import { useActionState, useState } from "react";
import { placeBidAction, type BidFormState } from "@/app/actions";
import type { PriceHistory } from "@/lib/data";
import type { MealType } from "@/lib/config";
import { formatMoney, parseMoney } from "@/lib/money";
import { Button, Notice } from "./ui";

const toInput = (cents: number) => (cents / 100).toFixed(2);

export function BidForm({
  mealId,
  mealType,
  initial,
  balance,
  maxGuests,
  weeksLeft,
  history,
}: {
  mealId: string;
  mealType: MealType;
  initial: number[];
  balance: number;
  maxGuests: number;
  weeksLeft: number;
  history: PriceHistory | null;
}) {
  const [rows, setRows] = useState<string[]>(initial.length ? initial.map(toInput) : [""]);
  const [active, setActive] = useState(0);
  const [state, formAction, pending] = useActionState<BidFormState, FormData>(placeBidAction, {});

  const parsed = rows.map((r) => (r.trim() === "" ? 0 : parseMoney(r)));
  const invalid = parsed.some((p) => p === null);
  const total = parsed.reduce<number>((s, p) => s + (p ?? 0), 0);
  const overBudget = total > balance;

  // Spread what's left over the rest of the quarter, about one guest a week. Whole dollars.
  const perWeek = Math.min(balance, Math.max(100, Math.round(balance / weeksLeft / 100) * 100));
  const picks = [
    { label: "Really want it", cents: Math.min(balance, perWeek * 2) },
    { label: "Would be nice", cents: perWeek },
    { label: "Only if cheap", cents: Math.round(perWeek / 2 / 50) * 50 },
    { label: "Only if free", cents: 0 },
  ];

  const setRow = (i: number, value: string) => setRows(rows.map((r, j) => (j === i ? value : r)));
  const meals = mealType === "lunch" ? "lunches" : "dinners";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="mealId" value={mealId} />

      <div className="space-y-1">
        <h2 className="font-semibold">How much is a guest worth to you?</h2>
        <p className="text-sm text-neutral-600">
          You have {formatMoney(balance)} for about {weeksLeft} more {weeksLeft === 1 ? "week" : "weeks"}. To bring a guest
          about once a week, aim for around <strong>{formatMoney(perWeek)}</strong> each.
        </p>
        <p className="text-sm text-neutral-600">
          {!history
            ? `No past prices for ${meals} yet.`
            : history.meals === 1
              ? `Last time, a ${mealType} guest spot cost ${formatMoney(history.typical)}.`
              : history.low === history.high
                ? `Recent ${meals}: a guest spot cost ${formatMoney(history.typical)}.`
                : `Recent ${meals}: a guest spot usually cost ${formatMoney(history.typical)} (between ${formatMoney(history.low)} and ${formatMoney(history.high)}).`}
        </p>
      </div>

      {balance > 0 && (
        <div className="space-y-1.5">
          {rows.length > 1 && <div className="text-xs text-neutral-500">Quick pick for guest {active + 1}:</div>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {picks.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setRow(active, toInput(p.cents))}
                className={`rounded-lg border px-2 py-2 text-center hover:bg-neutral-50 ${
                  parsed[active] === p.cents && rows[active].trim() !== "" ? "border-black bg-neutral-50" : "border-neutral-300"
                }`}
              >
                <div className="text-sm">{p.label}</div>
                <div className="font-semibold">{formatMoney(p.cents)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            <label htmlFor={`amount-${i}`} className="w-20 shrink-0 text-sm text-neutral-600">
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
                onFocus={() => setActive(i)}
                onChange={(e) => setRow(i, e.target.value)}
                className={`w-full rounded-lg border bg-white py-2.5 pr-3 pl-7 text-lg outline-none focus:ring-2 focus:ring-black ${
                  parsed[i] === null ? "border-red-400" : rows.length > 1 && i === active ? "border-black" : "border-neutral-300"
                }`}
              />
            </div>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setRows(rows.filter((_, j) => j !== i));
                  setActive(0);
                }}
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
        <button
          type="button"
          onClick={() => {
            setRows([...rows, ""]);
            setActive(rows.length);
          }}
          className="text-sm font-medium underline"
        >
          + Bid for another guest
        </button>
      )}

      <div className="text-sm text-neutral-600">
        Total: <span className={overBudget ? "font-semibold text-red-700" : "font-semibold"}>{formatMoney(total)}</span> of{" "}
        {formatMoney(balance)}
      </div>

      {invalid && <Notice kind="error">Amounts must be numbers like 5 or 2.50.</Notice>}
      {overBudget && <Notice kind="error">That&apos;s more Well Dollars than you have.</Notice>}
      {state.error && <Notice kind="error">{state.error}</Notice>}

      <div className="space-y-2">
        <Button type="submit" disabled={pending || invalid || overBudget} className="w-full text-lg">
          {pending ? "Saving…" : "Save my bid"}
        </Button>
        <p className="text-center text-xs text-neutral-500">
          Bidding high is safe. You only pay what it takes to beat the next person, never more than you bid.
        </p>
      </div>
    </form>
  );
}
