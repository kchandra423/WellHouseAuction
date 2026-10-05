import { test } from "node:test";
import assert from "node:assert/strict";
import { runAuction, trimToBudget, type AuctionBid } from "../src/lib/auction";

const S = 5;
const byBidder = (r: ReturnType<typeof runAuction>) => Object.fromEntries(r.map((x) => [x.bidder, x]));

test("one guest each: everyone pays the 6th-highest bid", () => {
  const bids: AuctionBid[] = [10, 20, 30, 40, 50, 60, 70].map((a, i) => ({ bidder: `p${a}`, amounts: [a], tieBreak: i }));
  const r = byBidder(runAuction(bids, S));
  for (const w of ["p30", "p40", "p50", "p60", "p70"]) assert.deepEqual([r[w].guests, r[w].payment], [1, 20]);
  for (const l of ["p10", "p20"]) assert.deepEqual([r[l].guests, r[l].payment], [0, 0]);
});

test("fewer bids than slots: everyone wins for free", () => {
  const r = runAuction([{ bidder: "a", amounts: [5, 3], tieBreak: 0 }, { bidder: "b", amounts: [0], tieBreak: 1 }], S);
  assert.deepEqual(r.map((x) => [x.guests, x.payment]), [[2, 0], [1, 0]]);
});

test("multi-slot bidder pays different prices per slot", () => {
  // A bids 100, 90, 80. Others: 70, 60, 50, 40, 30.
  // Top 5: 100, 90, 80, 70, 60. A wins 3 and knocked out 50, 40, 30.
  const r = byBidder(
    runAuction(
      [{ bidder: "A", amounts: [100, 90, 80], tieBreak: 0 }, ...[70, 60, 50, 40, 30].map((a, i) => ({ bidder: `o${a}`, amounts: [a], tieBreak: i + 1 }))],
      S,
    ),
  );
  assert.equal(r.A.guests, 3);
  assert.deepEqual(r.A.unitPrices, [30, 40, 50]);
  assert.equal(r.A.payment, 120);
  assert.equal(r.o70.payment, 50); // others paid the highest losing-without-them bid
});

test("ties go to the lowest tie-break number", () => {
  const bids = ["a", "b", "c", "d", "e", "f"].map((n, i) => ({ bidder: n, amounts: [10], tieBreak: i }));
  const r = byBidder(runAuction(bids, S));
  assert.equal(r.f.guests, 0);
  assert.equal(r.a.payment, 10);
});

test("trimToBudget drops lowest bids first", () => {
  assert.deepEqual(trimToBudget([500, 300, 200], 900), [500, 300]);
  assert.deepEqual(trimToBudget([500], 300), [300]);
  assert.deepEqual(trimToBudget([5, 3], 100), [5, 3]);
});

// Brute-force check of strategy-proofness: for random markets, nobody with
// diminishing values can ever do better by bidding anything other than the truth.
test("truthful bidding is always optimal (random search)", () => {
  let seed = 42;
  const rand = (n: number) => ((seed = (seed * 1103515245 + 12345) % 2 ** 31), seed % n);
  for (let trial = 0; trial < 3000; trial++) {
    const n = 1 + rand(5);
    const others: AuctionBid[] = Array.from({ length: n }, (_, i) => ({
      bidder: `o${i}`,
      amounts: Array.from({ length: 1 + rand(4) }, () => rand(30)),
      tieBreak: i + 1,
    }));
    const values = Array.from({ length: 1 + rand(5) }, () => rand(30)).sort((a, b) => b - a);
    const utility = (amounts: number[]) => {
      const me = runAuction([{ bidder: "me", amounts, tieBreak: 0 }, ...others], S).find((x) => x.bidder === "me")!;
      return values.slice(0, me.guests).reduce((s, v) => s + v, 0) - me.payment;
    };
    const truthful = utility(values);
    for (let k = 0; k < 20; k++) {
      const lie = Array.from({ length: rand(6) }, () => rand(35));
      assert.ok(utility(lie) <= truthful, `lie ${lie} beat truth ${values} vs ${JSON.stringify(others)}`);
    }
  }
});
