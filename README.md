# klippa

A tiny web app for planning hair-wash days ahead of time. Set your routine
once, subscribe the generated link into Google or Apple Calendar, and it
keeps projecting wash days into the future — no account, no app install.

## How it works

- You enter your last wash date, how often you wash (every N days), and
  optionally which weekdays you prefer and any dates to avoid.
- Those settings are encoded directly into the query string of a personal
  `.ics` feed URL (`/api/feed?...`) — there's no database or login.
- `GET /api/feed` computes the next year of wash dates on the fly (see
  `lib/schedule.ts`) and returns them as an iCalendar feed (`lib/ics.ts`).
- Subscribing to that URL as an external/subscribed calendar in Google or
  Apple Calendar makes it periodically re-fetch the feed, so new occurrences
  keep appearing automatically as time passes.

Changing your routine on the page produces a new URL — re-subscribe with the
new link to update an existing subscription.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npx tsc --noEmit   # typecheck
npx eslint .       # lint
npx next build     # production build
```

## Deploying

This is a standard Next.js app — deploys as-is to
[Vercel](https://vercel.com/new) (or any Node hosting that supports Next.js
route handlers). No environment variables or external services are required.
