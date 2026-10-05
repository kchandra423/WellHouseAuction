// ─────────────────────────────────────────────────────────────
// Edit this file to change how the auction works.
// ─────────────────────────────────────────────────────────────

/** Guest slots available at every meal. */
export const SLOTS_PER_MEAL = 5;

/** Well Dollars everyone starts each quarter with. */
export const STARTING_BALANCE = 100;

/** All dates and deadlines use dorm (Pacific) time. */
export const TIMEZONE = "America/Los_Angeles";

/** Bidding closes at this hour (24h clock) the day BEFORE the meal. */
export const CLOSE_HOUR = 20; // 8pm

/** How many days ahead people can see and bid on meals. */
export const DAYS_AHEAD = 14;

/**
 * Quarters. Everyone's balance resets to STARTING_BALANCE at the start of each one.
 * Dates are inclusive, YYYY-MM-DD. Meals outside every quarter are not auctioned.
 */
export const QUARTERS = [
  { name: "Autumn 2026", start: "2026-09-21", end: "2026-12-11" },
  { name: "Winter 2027", start: "2027-01-04", end: "2027-03-19" },
  { name: "Spring 2027", start: "2027-03-29", end: "2027-06-09" },
];

export const MEAL_TYPES = ["lunch", "dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];
