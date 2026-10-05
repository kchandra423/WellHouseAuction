import { db } from "./db";
import { runAuction, trimToBudget } from "./auction";
import { SLOTS_PER_MEAL, STARTING_BALANCE } from "./config";
import { compareMealIds, parseMealId, quarterFor, type Quarter } from "./time";

export type Bid = { mealId: string; amounts: number[] };
export type Result = {
  mealId: string;
  email: string;
  name: string;
  bidAmounts: number[];
  trimmed: boolean;
  guests: number;
  payment: number;
  unitPrices: number[];
};

// ── Users & access ──

export function isStanfordEmail(email: string | null | undefined): email is string {
  const e = (email ?? "").toLowerCase();
  return e.endsWith("@stanford.edu") || /@[a-z0-9-]+\.stanford\.edu$/.test(e);
}

export function isAdmin(email: string | null | undefined) {
  const admins = (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(/[\s,]+/).filter(Boolean);
  return !!email && admins.includes(email.toLowerCase());
}

/** If the residents list is empty, any Stanford email can use the site. */
export async function canUseSite(email: string) {
  if (!isStanfordEmail(email)) return false;
  if (isAdmin(email)) return true;
  const sql = await db();
  const [{ count }] = await sql`select count(*)::int as count from residents`;
  if (count === 0) return true;
  const rows = await sql`select 1 from residents where email = ${email.toLowerCase()}`;
  return rows.length > 0;
}

export async function upsertUser(email: string, name: string) {
  const sql = await db();
  await sql`
    insert into users (email, name) values (${email}, ${name})
    on conflict (email) do update set name = excluded.name`;
}

export async function getResidents(): Promise<string[]> {
  const sql = await db();
  const rows = await sql`select email from residents order by email`;
  return rows.map((r) => r.email);
}

export async function setResidents(emails: string[]) {
  const sql = await db();
  await sql.begin(async (tx) => {
    await tx`delete from residents`;
    if (emails.length) await tx`insert into residents ${tx(emails.map((email) => ({ email })))}`;
  });
}

// ── Balances ──

export async function getBalance(email: string, quarter: Quarter): Promise<number> {
  const sql = await db();
  const [{ spent }] = await sql`
    select coalesce(sum(payment), 0)::int as spent from results
    where email = ${email} and meal_date between ${quarter.start} and ${quarter.end}`;
  return STARTING_BALANCE * 100 - spent;
}

// ── Bids ──

export async function getMyBids(email: string): Promise<Map<string, number[]>> {
  const sql = await db();
  const rows = await sql`select meal_id, amounts from bids where email = ${email}`;
  return new Map(rows.map((r) => [r.meal_id, r.amounts]));
}

export async function saveBid(email: string, mealId: string, amounts: number[]) {
  const sql = await db();
  if (amounts.length === 0) {
    await sql`delete from bids where meal_id = ${mealId} and email = ${email}`;
    return;
  }
  await sql`
    insert into bids (meal_id, email, amounts) values (${mealId}, ${email}, ${amounts})
    on conflict (meal_id, email) do update set amounts = excluded.amounts, updated_at = now()`;
}

// ── Cancelled meals ──

export async function getCancelledMeals(): Promise<Set<string>> {
  const sql = await db();
  const rows = await sql`select meal_id from cancelled_meals`;
  return new Set(rows.map((r) => r.meal_id));
}

export async function setMealCancelled(mealId: string, cancelled: boolean) {
  const sql = await db();
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(4242)`;
    if (cancelled) {
      await tx`insert into cancelled_meals (meal_id) values (${mealId}) on conflict do nothing`;
      // Already ran? Refund everyone.
      await tx`delete from results where meal_id = ${mealId}`;
      await tx`update cleared_meals set cancelled = true where meal_id = ${mealId}`;
    } else {
      await tx`delete from cancelled_meals where meal_id = ${mealId}`;
      // If it was already closed as cancelled, let it run again with the original bids.
      await tx`delete from cleared_meals where meal_id = ${mealId} and cancelled`;
    }
  });
}

// ── Results ──

export async function getResults(mealIds: string[]): Promise<Map<string, Result[]>> {
  const out = new Map<string, Result[]>();
  if (!mealIds.length) return out;
  const sql = await db();
  const rows = await sql`
    select r.*, coalesce(nullif(u.name, ''), r.email) as name
    from results r left join users u on u.email = r.email
    where r.meal_id in ${sql(mealIds)}
    order by r.guests desc, name`;
  for (const r of rows) {
    const list = out.get(r.meal_id) ?? [];
    list.push({
      mealId: r.meal_id,
      email: r.email,
      name: r.name,
      bidAmounts: r.bid_amounts,
      trimmed: r.trimmed,
      guests: r.guests,
      payment: r.payment,
      unitPrices: r.unit_prices,
    });
    out.set(r.meal_id, list);
  }
  return out;
}

export async function getClearedMealIds(): Promise<Set<string>> {
  const sql = await db();
  const rows = await sql`select meal_id from cleared_meals where not cancelled`;
  return new Set(rows.map((r) => r.meal_id));
}

export async function getMyResults(email: string): Promise<Result[]> {
  const sql = await db();
  const rows = await sql`select * from results where email = ${email} order by meal_date desc`;
  return rows.map((r) => ({
    mealId: r.meal_id,
    email: r.email,
    name: "",
    bidAmounts: r.bid_amounts,
    trimmed: r.trimmed,
    guests: r.guests,
    payment: r.payment,
    unitPrices: r.unit_prices,
  }));
}

// ── Clearing ──

/**
 * Runs every auction whose deadline has passed and hasn't been run yet.
 * Safe to call as often as we like (every page load + a daily cron): bids are frozen at
 * the deadline, so the result is the same no matter when this actually runs.
 */
export async function clearDueMeals(now = new Date()) {
  const sql = await db();
  const pending = await sql`
    select distinct b.meal_id from bids b
    left join cleared_meals c on c.meal_id = b.meal_id
    where c.meal_id is null`;
  const due = pending
    .map((r) => r.meal_id as string)
    .filter((id) => {
      const meal = parseMealId(id);
      return meal && meal.closesAt <= now;
    })
    .sort(compareMealIds); // budgets depend on earlier meals, so go in order

  for (const mealId of due) await clearMeal(mealId);
}

async function clearMeal(mealId: string) {
  const meal = parseMealId(mealId)!;
  const quarter = quarterFor(meal.date)!;
  const sql = await db();

  await sql.begin(async (tx) => {
    // Only one request clears at a time; skip if someone else already did this meal.
    await tx`select pg_advisory_xact_lock(4242)`;
    const done = await tx`select 1 from cleared_meals where meal_id = ${mealId}`;
    if (done.length) return;

    const [cancelled] = await tx`select 1 from cancelled_meals where meal_id = ${mealId}`;
    if (cancelled) {
      await tx`insert into cleared_meals (meal_id, cancelled) values (${mealId}, true)`;
      return;
    }

    const bids = await tx`select email, amounts, created_at from bids where meal_id = ${mealId}`;
    const prepared = [];
    for (const b of bids) {
      const [{ spent }] = await tx`
        select coalesce(sum(payment), 0)::int as spent from results
        where email = ${b.email} and meal_date between ${quarter.start} and ${quarter.end}`;
      const balance = STARTING_BALANCE * 100 - spent;
      const amounts = trimToBudget(b.amounts, balance);
      prepared.push({
        bidder: b.email as string,
        amounts,
        trimmed: amounts.join() !== [...b.amounts].sort((x: number, y: number) => y - x).join(),
        tieBreak: new Date(b.created_at).getTime(),
      });
    }

    const outcome = runAuction(prepared, SLOTS_PER_MEAL);
    for (const r of outcome) {
      const p = prepared.find((x) => x.bidder === r.bidder)!;
      await tx`
        insert into results (meal_id, meal_date, email, bid_amounts, trimmed, guests, payment, unit_prices)
        values (${mealId}, ${meal.date}, ${r.bidder}, ${p.amounts}, ${p.trimmed}, ${r.guests}, ${r.payment}, ${r.unitPrices})`;
    }
    await tx`insert into cleared_meals (meal_id) values (${mealId})`;
  });
}
