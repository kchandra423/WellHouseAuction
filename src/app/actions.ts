"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentEmail, signIn, signOut } from "@/auth";
import { getBalance, getCancelledMeals, isAdmin, saveBid, setMealCancelled, setResidents } from "@/lib/data";
import { SLOTS_PER_MEAL } from "@/lib/config";
import { formatMoney, parseMoney } from "@/lib/money";
import { isOpen, parseMealId, quarterFor } from "@/lib/time";

export async function signInAction() {
  await signIn("google", { redirectTo: "/" });
}

export async function devSignInAction(formData: FormData) {
  await signIn("dev", { email: String(formData.get("email")), redirectTo: "/" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export type BidFormState = { error?: string };

export async function placeBidAction(_prev: BidFormState, formData: FormData): Promise<BidFormState> {
  const email = await currentEmail();
  if (!email) return { error: "You've been signed out. Please sign in again." };

  const meal = parseMealId(String(formData.get("mealId")));
  if (!meal) return { error: "That meal doesn't exist." };
  if (!isOpen(meal)) return { error: "Sorry, bidding for this meal has already closed." };
  if ((await getCancelledMeals()).has(meal.id)) return { error: "This meal has been cancelled." };

  const raw = formData.getAll("amount").map(String).filter((s) => s.trim() !== "");
  if (raw.length === 0) return { error: "Type an amount first. $0 is OK." };
  if (raw.length > SLOTS_PER_MEAL) return { error: `You can bid on at most ${SLOTS_PER_MEAL} guests.` };
  const amounts: number[] = [];
  for (const r of raw) {
    const cents = parseMoney(r);
    if (cents === null) return { error: `"${r}" isn't a valid amount. Use a number like 5 or 2.50.` };
    amounts.push(cents);
  }
  amounts.sort((a, b) => b - a);

  const balance = await getBalance(email, quarterFor(meal.date)!);
  const total = amounts.reduce((s, a) => s + a, 0);
  if (total > balance) {
    return { error: `Your bids add up to ${formatMoney(total)}, but you only have ${formatMoney(balance)}.` };
  }

  await saveBid(email, meal.id, amounts);
  revalidatePath("/");
  redirect(`/?saved=${meal.id}`);
}

export async function removeBidAction(formData: FormData) {
  const email = await currentEmail();
  const meal = parseMealId(String(formData.get("mealId")));
  if (!email || !meal || !isOpen(meal)) return;
  await saveBid(email, meal.id, []);
  revalidatePath("/");
  redirect(`/?removed=${meal.id}`);
}

// ── Admin ──

async function requireAdmin() {
  const email = await currentEmail();
  if (!isAdmin(email)) throw new Error("Admins only");
}

export async function saveResidentsAction(formData: FormData) {
  await requireAdmin();
  const emails = [
    ...new Set(
      String(formData.get("residents") ?? "")
        .toLowerCase()
        .split(/[\s,;]+/)
        .filter((e) => e.includes("@")),
    ),
  ];
  await setResidents(emails);
  revalidatePath("/admin");
}

export async function toggleCancelAction(formData: FormData) {
  await requireAdmin();
  const meal = parseMealId(String(formData.get("mealId")));
  if (!meal) return;
  await setMealCancelled(meal.id, formData.get("cancel") === "1");
  revalidatePath("/", "layout");
}
