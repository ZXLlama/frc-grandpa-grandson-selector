# FRC爺爺孫子選擇器

Mobile-first full-stack Next.js app for analyzing an FRC event with server-side The Blue Alliance data and scoring every team from `-10` to `10`.

## Stack

- Next.js 16 + TypeScript
- App Router
- Server-side API routes for all TBA requests
- Designed for Vercel deployment
- Single repository for frontend and backend

## Features

- Traditional Chinese and English UI
- Year, district, competition type, and event selection on one page
- Server-only TBA API access with `X-TBA-Auth-Key`
- Lightweight server cache with ETag support and timeouts
- Defensive response validation with `zod`
- Transparent modular scoring model
- Responsive dark-theme UI optimized for mobile

## Scoring Model

The final score is normalized into `-10` to `10` and mapped as:

- `7 to 10`: 爺爺 / Grandpa
- `3 to <7`: 爸爸 / Father
- `-3 to <3`: 平輩 / Peer
- `-7 to <-3`: 兒子 / Son
- `-10 to <-7`: 孫子 / Grandson

Current inputs:

- Event ranking performance
- Match win rate at the selected event
- Recent match trend/form
- Average alliance score proxy from played matches
- Schedule strength adjustment
- Small awards / playoff bonus when available

If data is sparse, missing metrics automatically lose weight and the final score is damped toward neutral.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Update the included `.env.local` file with your TBA key:

   ```env
   TBA_API_KEY=your_key_here
   ```

3. Start development:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Required:

- `TBA_API_KEY`

Security notes:

- The TBA key is never exposed to the client
- All TBA requests run on the server through `app/api/*`
- The frontend only talks to your own API routes

## API Routes

- `GET /api/events?year=2026`
- `GET /api/event/[eventKey]/scores`

## Local Verification

Run:

```bash
npm run lint
npm run build
```

## Deploying to Vercel

1. Push this project to a GitHub repository.
2. Import the repo into Vercel.
3. Add `TBA_API_KEY` in Vercel Project Settings → Environment Variables.
4. Deploy.

Notes:

- No separate backend service is required.
- The API routes run as Vercel Functions.
- The in-memory cache is lightweight and instance-local, which is appropriate for this app.

## Project Structure

```text
app/
  api/
components/
lib/
  scoring/
  server/
```

## Data Source

This app uses [The Blue Alliance](https://www.thebluealliance.com/) API v3.
