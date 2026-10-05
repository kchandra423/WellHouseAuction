import { Card } from "@/components/ui";
import { SLOTS_PER_MEAL, STARTING_BALANCE } from "@/lib/config";

export default function HowItWorks() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">How it works</h1>

      <Card className="space-y-2">
        <h2 className="font-semibold">The short version</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>You get {STARTING_BALANCE} Well Dollars every quarter. They&apos;re not real money.</li>
          <li>Every weekday lunch and dinner has {SLOTS_PER_MEAL} guest spots.</li>
          <li>Bid on any meal, for as many guests as you want (up to {SLOTS_PER_MEAL}).</li>
          <li>Bidding closes at 8pm the night before the meal. The top {SLOTS_PER_MEAL} bids win.</li>
          <li>
            <strong>Just bid what a guest is actually worth to you.</strong> That&apos;s always the best strategy.
          </li>
        </ol>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-semibold">What will I pay?</h2>
        <p>
          Never more than you bid, and usually less. If you win, you pay the bid you beat — the highest bid that would have
          gotten the spot if you hadn&apos;t been there.
        </p>
        <p className="text-sm text-neutral-600">
          Example: 7 people each bid for one guest: $10, $8, $6, $5, $4, $3, $1. The top 5 win, and they each pay $3 (the
          6th-highest bid).
        </p>
        <p className="text-sm text-neutral-600">
          If you bid for several guests, each guest can cost a different amount, because each of your spots beat a different
          bid. Your 2nd guest is never cheaper than your 1st.
        </p>
        <p className="text-sm text-neutral-600">If fewer than {SLOTS_PER_MEAL} guests are wanted, everyone who bid gets in for free.</p>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-semibold">Why should I bid my true value?</h2>
        <p>Because what you pay is set by other people&apos;s bids, not yours. Your bid only decides <em>whether</em> you win.</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600">
          <li>Bid lower than it&apos;s worth: you might lose a spot you would have happily paid for.</li>
          <li>Bid higher than it&apos;s worth: you might win and pay more than it was worth to you.</li>
        </ul>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-semibold">Fine print</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600">
          <li>You can change or remove your bid any time before it closes.</li>
          <li>Your bids for one meal can&apos;t add up to more than the Well Dollars you have.</li>
          <li>
            If you bid on several meals and win earlier ones, you might not have enough left for a later one. If that happens,
            your lowest bids on the later meal are dropped until it fits.
          </li>
          <li>Ties go to whoever bid first.</li>
          <li>Other residents can&apos;t see your bids. Only the winners&apos; names are shown after bidding closes.</li>
          <li>Leftover Well Dollars don&apos;t carry over to next quarter.</li>
        </ul>
      </Card>
    </div>
  );
}
