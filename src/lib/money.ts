/** All money is stored as whole cents to avoid rounding errors. */

export function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/** "12", "12.5", "$12.50" → 1250. Returns null if it isn't a valid non-negative amount. */
export function parseMoney(input: string): number | null {
  const s = input.trim().replace(/^\$/, "");
  if (s === "") return null;
  if (!/^\d*(\.\d{0,2})?$/.test(s) || s === ".") return null;
  return Math.round(parseFloat(s) * 100);
}
