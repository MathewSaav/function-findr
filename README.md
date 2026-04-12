# ⚡ FINDR

**The Move Is Here.**

Real-time party aggregator that pulls events from Eventbrite, Plotz, Partiful, Dice, and user submissions into one feed with a live heat map. Built for a hackathon, designed to ship.

---

## Quick Start

```bash
git clone https://github.com/YOUR_USER/function-findr.git
cd function-findr
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
npx vercel --prod
```

Add env vars in Vercel dashboard → Settings → Environment Variables.

---

## Whop Integration

1. Create app at [dash.whop.com](https://dash.whop.com) → API Keys → Create App
2. Copy Client ID → `NEXT_PUBLIC_WHOP_APP_ID` in `.env.local`
3. Set Base Domain to your Vercel URL
4. Set App Path to `/`
5. Add app to your Whop → Tools → select your app

The app allows iframe embedding out of the box via `next.config.js` headers.

---

## Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js | 15.5.15 |
| React | React | 19.x |
| Whop SDK | @whop/iframe + @whop/react | 0.0.6 / 0.3.2 |
| Map | Leaflet + CartoDB dark tiles | 1.9.4 |
| Styling | Tailwind CSS | 3.4.x |
| Fonts | Bebas Neue + DM Sans | Google Fonts |
| Signups | File-based JSON | — |

All dependency versions verified against npm registry. Zero install conflicts.

---

## Project Structure

```
app/
  page.tsx              Feed — event cards sorted by fire count
  map/page.tsx          Heat map — Leaflet + canvas blob overlay
  signup/page.tsx       Waitlist — email collection + live counter
  api/signup/route.ts   POST/GET signup endpoint
  layout.tsx            Root layout + bottom nav
  globals.css           Crimson dark theme + Leaflet overrides

components/
  BottomNav.tsx         4-tab nav (Feed, Map, Alerts, Profile)
  EventCard.tsx         Event card with hero gradient, source badge, fire counter

lib/
  events.ts             Types, seed data, heat tier config
  whop.ts               Whop iframe SDK helper
```

---

## Heat Map

Uses vanilla Leaflet (not react-leaflet — avoids React 19 peer dep conflict) with CartoDB `dark_all` tiles. A canvas overlay draws radial gradient blobs at each event position. Blob size and opacity scale directly with fire count:

- **0 fire** → 25px radius, 35% opacity
- **250+ fire** → 85px radius, 80% opacity

Color follows intensity tiers:
- 🔴 **Explosive** (150+) — crimson `#dc2743`
- 🟣 **Underground** (60–149) — purple `#a855f7`
- 🟢 **Social Chill** (0–59) — emerald `#34d399`

Canvas redraws on pan/zoom via Leaflet `moveend` + `zoomend` events.

---

## Screens

**Feed** — Vertical scroll of event cards. Each card has a gradient hero, source badge (PARTIFUL / EVENTBRITE / etc.), fire counter, vibe tag, location pin, time window, and action button. Filter by vibe type. FAB button for posting.

**Heat Map** — Full-screen dark map with glowing blobs. Search bar, vibe filter chips, real-time vibe legend. Tap a blob to see event details.

**Waitlist** — "THE MOVE IS HERE" landing. Avatar stack with live counter, email input, crimson CTA button. Shows queue position on submit.

---

## Git Setup

```bash
git init
git add .
git commit -m "init: findr hackathon skeleton"
git remote add origin https://github.com/YOUR_USER/function-findr.git
git push -u origin main
```

---

## License

MIT
# function-findr
