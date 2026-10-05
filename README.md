# Well House Guest Auction

Residents get 100 Well Dollars a quarter and bid on the 5 guest slots at each weekday lunch and dinner.
Each meal's auction closes at 8pm (Pacific) the night before.

**Auction rules:** multi-unit Vickrey auction (VCG). The top 5 bids win. For each slot you win, you pay one of the bids you knocked out, so different slots can cost different amounts. When everyone wants one guest, it's a plain 6th-price auction. Bidding your true value is always your best strategy. The logic and its tests are in [`src/lib/auction.ts`](src/lib/auction.ts) and [`tests/auction.test.ts`](tests/auction.test.ts).

Settings you might want to change (quarters, budget, closing time, how far ahead people can bid) are in [`src/lib/config.ts`](src/lib/config.ts).

## Stack

- Next.js on Vercel
- Postgres (Neon free tier, added from the Vercel dashboard). Tables are created automatically.
- Google sign-in via Auth.js. Only verified `@stanford.edu` accounts get in.
- Auctions run automatically the first time anyone loads a page after the deadline, and a daily Vercel cron runs them as a backup. Bids are locked at the deadline, so it doesn't matter exactly when the auction runs.

## One-time setup

### 1. Deploy to Vercel
1. Push this repo to GitHub and import it at https://vercel.com/new.
2. In the project go to **Storage → Create Database → Neon (Postgres)** and connect it. This sets `DATABASE_URL` for you.

### 2. Google sign-in
1. Go to https://console.cloud.google.com/, create a project (any name, e.g. "Well House Auction").
2. **APIs & Services → OAuth consent screen**: choose **External**, set the app name and your email, then publish it ("In production"). With only basic email/profile scopes, Google doesn't require a review.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → "Web application".
   - Authorized redirect URIs:
     - `https://YOUR-APP.vercel.app/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (for local testing)
4. Copy the Client ID and Client Secret.

### 3. Environment variables (Vercel → Settings → Environment Variables)
| Name | Value |
| --- | --- |
| `AUTH_SECRET` | output of `npx auth secret` (any long random string) |
| `AUTH_GOOGLE_ID` | Google client ID |
| `AUTH_GOOGLE_SECRET` | Google client secret |
| `ADMIN_EMAILS` | your email(s), comma-separated |
| `CRON_SECRET` | any random string (optional) |

Redeploy after adding them.

### 4. Restrict to Well House residents (recommended)
By default any Stanford account can sign in. To limit it to residents, sign in as an admin, open **Admin**, and paste the residents' emails.

## Local development

```bash
cp .env.example .env.local   # fill in DATABASE_URL (local Postgres or a Neon dev branch) and AUTH_SECRET
npm install
npm run dev
```

In development the sign-in page also has a **dev sign in** box, so you can sign in as any email without Google. It never appears in production.

```bash
npm test   # auction logic tests, including a brute-force check that truthful bidding is optimal
```
