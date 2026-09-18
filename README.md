# ExpenseAI

Smart expense tracker with:
- **Receipt OCR** — drop a struk, Claude vision extracts merchant/date/total/category
- **Route learning** — type "Kantor → Pabrik Jatake", Google Maps fills mileage; cached per user as a `RoutePreset`
- **Bi-directional suggestions** — type "Drone" → suggests destinations you've paired with it; type a place → suggests purposes
- **Auto-grouping** — every attachment on the same day + purpose rolls into one `Trip`
- **Auth** — Email magic link, Google, Apple

## Stack
Next.js 16 · TypeScript · Tailwind v4 · Prisma 6 · Postgres · Auth.js v5 · Anthropic Claude · Google Maps

## Local setup

```bash
npm install
cp .env.example .env.local           # fill every value
npx prisma migrate dev --name init   # create tables
npm run dev
```

## Deploy to Railway

1. Push this repo to GitHub.
2. Railway → New Project → Deploy from GitHub.
3. Provision Postgres → copy `DATABASE_URL` into service env.
4. Add every other var from `.env.example` (`AUTH_SECRET`, Google/Apple client IDs, `ANTHROPIC_API_KEY`, `GOOGLE_MAPS_API_KEY`, SMTP).
5. Railway runs `npm run build` then `npm start` automatically.
6. Add a deploy hook / release command: `npx prisma migrate deploy`.

## Structure

```
src/
  app/
    login/            # magic-link + Google + Apple
    chat/             # main entry
    trips/            # list
    report/[id]/      # printable reimbursement report
    api/
      auth/[...nextauth]/
      ocr/            # Claude vision
      route-estimate/ # Google Maps + preset cache
      suggest/        # PurposeLink lookups
      attach/         # persist OCR result into a Trip
  components/chat/    # ChatShell, MessageList, Composer, SuggestionChips
  lib/
    db/prisma.ts
    ocr/claude-vision.ts
    maps/distance.ts
    learning/purpose-links.ts
    trip/group.ts
    format.ts
prisma/schema.prisma
```
