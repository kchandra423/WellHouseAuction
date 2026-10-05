import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { CLOSE_HOUR, DAYS_AHEAD, MEAL_TYPES, MealType, QUARTERS, TIMEZONE } from "./config";

export type Meal = {
  id: string; // e.g. "2026-10-06-lunch"
  date: string; // "2026-10-06"
  type: MealType;
  closesAt: Date;
};

export type Quarter = (typeof QUARTERS)[number];

export function todayInDorm(now = new Date()): string {
  return formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd");
}

export function mealId(date: string, type: MealType) {
  return `${date}-${type}`;
}

export function parseMealId(id: string): Meal | null {
  const m = /^(\d{4}-\d{2}-\d{2})-(lunch|dinner)$/.exec(id);
  if (!m) return null;
  const date = m[1];
  const type = m[2] as MealType;
  if (!isMealDay(date) || !quarterFor(date)) return null;
  return { id, date, type, closesAt: closesAt(date) };
}

/** 8pm (dorm time) on the day before the meal. */
export function closesAt(date: string): Date {
  const dayBefore = format(addDays(parseISO(date), -1), "yyyy-MM-dd");
  const hh = String(CLOSE_HOUR).padStart(2, "0");
  return fromZonedTime(`${dayBefore}T${hh}:00:00`, TIMEZONE);
}

/** Meals are served Monday–Friday. */
export function isMealDay(date: string) {
  const dow = parseISO(date).getDay();
  return dow >= 1 && dow <= 5;
}

export function quarterFor(date: string): Quarter | undefined {
  return QUARTERS.find((q) => date >= q.start && date <= q.end);
}

/** The quarter happening now, or the next one if we're between quarters. */
export function currentQuarter(now = new Date()): Quarter | undefined {
  const today = todayInDorm(now);
  return quarterFor(today) ?? QUARTERS.find((q) => q.start > today);
}

/** Lunch before dinner, earlier dates first. */
export function compareMealIds(a: string, b: string) {
  const [da, db] = [a.slice(0, 10), b.slice(0, 10)];
  if (da !== db) return da < db ? -1 : 1;
  return MEAL_TYPES.indexOf(a.slice(11) as MealType) - MEAL_TYPES.indexOf(b.slice(11) as MealType);
}

/** Every meal from today through DAYS_AHEAD days out. */
export function upcomingMeals(now = new Date()): Meal[] {
  const start = parseISO(todayInDorm(now));
  const meals: Meal[] = [];
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const date = format(addDays(start, i), "yyyy-MM-dd");
    if (!isMealDay(date) || !quarterFor(date)) continue;
    for (const type of MEAL_TYPES) meals.push({ id: mealId(date, type), date, type, closesAt: closesAt(date) });
  }
  return meals;
}

/** Weeks left in the quarter, counting this one. At least 1. */
export function weeksLeft(quarter: Quarter, now = new Date()) {
  const days = differenceInCalendarDays(parseISO(quarter.end), parseISO(todayInDorm(now))) + 1;
  return Math.max(1, Math.ceil(days / 7));
}

export function isOpen(meal: Meal, now = new Date()) {
  return now < meal.closesAt;
}

// ── Display helpers ──

export function mealDayLabel(date: string) {
  return format(parseISO(date), "EEEE, MMM d"); // "Tuesday, Oct 6"
}

export function mealLabel(meal: { date: string; type: MealType }) {
  return `${meal.type === "lunch" ? "Lunch" : "Dinner"} · ${mealDayLabel(meal.date)}`;
}

export function closeLabel(d: Date) {
  return formatInTimeZone(d, TIMEZONE, "EEE, MMM d 'at' h:mmaaa"); // "Mon, Oct 5 at 8:00pm"
}
