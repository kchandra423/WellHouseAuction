/**
 * Multi-unit Vickrey auction (the VCG mechanism for identical items).
 *
 * Each bidder submits one bid per guest slot they want: the most they'd pay for their
 * 1st guest, their 2nd guest, and so on. The highest SLOTS bids win.
 *
 * Price: a winner pays, for each slot they win, one of the bids they "knocked out" —
 * the bids from other people that would have won if this bidder hadn't bid. So:
 *   - you never pay more than you bid,
 *   - different slots can cost different amounts,
 *   - your price never depends on your own bids, so bidding your true value is always
 *     your best strategy (strategy-proof).
 *
 * With one guest per person this is exactly a "6th-price" auction: all 5 winners pay
 * the 6th-highest bid.
 */

export type AuctionBid = {
  bidder: string;
  amounts: number[]; // cents, any order
  tieBreak: number; // lower wins ties (we use a random number)
};

export type AuctionResult = {
  bidder: string;
  guests: number;
  payment: number; // cents
  unitPrices: number[]; // cents, cheapest first; sums to payment
};

type Unit = { bidder: string; amount: number; tieBreak: number; rank: number };

function sortUnits(units: Unit[]) {
  return units.sort(
    (a, b) => b.amount - a.amount || a.tieBreak - b.tieBreak || a.bidder.localeCompare(b.bidder) || a.rank - b.rank,
  );
}

export function runAuction(bids: AuctionBid[], slots: number): AuctionResult[] {
  const units: Unit[] = bids.flatMap((b) =>
    [...b.amounts].sort((x, y) => y - x).map((amount, rank) => ({ bidder: b.bidder, amount, tieBreak: b.tieBreak, rank })),
  );
  const winners = sortUnits([...units]).slice(0, slots);

  return bids.map((b) => {
    const guests = winners.filter((u) => u.bidder === b.bidder).length;
    // Everyone else's bids, highest first. Missing bids count as $0.
    const others = units
      .filter((u) => u.bidder !== b.bidder)
      .map((u) => u.amount)
      .sort((x, y) => y - x);
    // Without this bidder, others would win slots 1..SLOTS. With them, others only get
    // the top (SLOTS - guests). The ones knocked out are what this bidder pays.
    const unitPrices: number[] = [];
    for (let j = 1; j <= guests; j++) unitPrices.push(others[slots - j] ?? 0);
    return { bidder: b.bidder, guests, payment: unitPrices.reduce((s, p) => s + p, 0), unitPrices };
  });
}

/**
 * If someone spent money in an earlier auction and their bids for this meal now add up
 * to more than they have left, drop their lowest bids until it fits.
 * Since you never pay more than your winning bids, this guarantees no one goes negative.
 */
export function trimToBudget(amounts: number[], balance: number): number[] {
  const a = [...amounts].sort((x, y) => y - x);
  const sum = () => a.reduce((s, x) => s + x, 0);
  while (a.length > 1 && sum() > balance) a.pop();
  if (a.length === 1 && a[0] > balance) a[0] = Math.max(0, balance);
  return a;
}
