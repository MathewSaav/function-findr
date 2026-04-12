# CLAUDE.md — Function Findr

## What This Is

Function Findr is a real-time party aggregator. It pulls events from Eventbrite, Plotz, Partiful, Dice, and user submissions into one feed with a live heat map. Built for a hackathon, deploying on Whop, collecting signups at a booth Monday.

The tagline: **"Every party. Every app. One map."**

---

## Stack (locked — do not change versions)

| Package | Version | Why this exact version |
|---|---|---|
| next | 15.5.15 | Supports React 19, Whop SDK needs Next.js |
| react / react-dom | ^19.0.0 | Required by @whop/react@0.3.2 peer dep |
| @whop/iframe | 0.0.6 | Latest published, no React peer dep, for iframe communication |
| @whop/react | 0.3.2 | Latest published, peers react@^19.0.0 |
| leaflet | 1.9.4 | Vanilla JS, no React peer dep, used directly via useRef (NOT react-leaflet) |
| tailwindcss | ^3.4.0 | Styling |
| typescript | ^5.7.0 | Types |

**Critical:** Do NOT add `react-leaflet` — it only supports React 18 and will break the build. Leaflet is used directly via `import("leaflet")` in a `useEffect`.

---

## Project Structure

```
function-findr/
├── app/
│   ├── layout.tsx              # Root layout, imports BottomNav
│   ├── globals.css             # Tailwind + CSS vars + Bebas Neue / DM Sans fonts
│   ├── page.tsx                # FEED — event cards sorted by fire count, vibe filter chips
│   ├── map/page.tsx            # HEAT MAP — Leaflet dark tiles + canvas heat blob overlay
│   ├── signup/page.tsx         # WAITLIST — email collection, "THE MOVE IS HERE" landing
│   └── api/signup/route.ts     # POST/GET signups (file-based JSON store)
├── components/
│   ├── BottomNav.tsx           # 4-tab nav: Feed, Map, Alerts, Profile (SVG icons)
│   └── EventCard.tsx           # Card with gradient hero, source badge, fire counter, vibe tag
├── lib/
│   ├── events.ts               # Types, VIBE_CONFIG, SOURCE_CONFIG, HEAT_TIERS, SEED_EVENTS
│   └── whop.ts                 # Whop iframe SDK init (createSdk from @whop/iframe)
├── CLAUDE.md                   # This file
├── .env.local.example
├── .gitignore
├── next.config.js              # X-Frame-Options: ALLOWALL for Whop iframe embedding
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

---

## Design System

### Color Palette (CSS variables in globals.css)

| Variable | Hex | Usage |
|---|---|---|
| --bg | #0c0a0e | Page background, very dark with warm undertone |
| --bg-card | #1a1118 | Card backgrounds |
| --bg-card-elevated | #221820 | Raised surfaces, avatars |
| --border | #2e1f28 | Borders, dividers |
| --accent | #dc2743 | Primary crimson — buttons, logo, active states, hot heat blobs |
| --text | #f2eeef | Primary text |
| --text-dim | #8a7e83 | Secondary text |
| --text-muted | #5c5258 | Tertiary/disabled text |

### Source Badge Colors

| Source | Color | Hex |
|---|---|---|
| Partiful | Red | #dc2743 |
| Eventbrite | Orange | #f0854a |
| Plotz | Purple | #a855f7 |
| User Submitted | Cyan | #0ea5e9 |
| Dice | Sky Blue | #38bdf8 |

### Vibe Tag Colors

| Vibe | Hex |
|---|---|
| Rave | #dc2743 |
| Darty | #f0854a |
| Kickback | #34d399 |
| House Party | #f472b6 |
| Bar Night | #60a5fa |
| Club Event | #a855f7 |

### Typography

- **Display/Headings:** Bebas Neue (Google Fonts), all caps, wide tracking
- **Body/UI:** DM Sans (Google Fonts), weights 400-700
- **Labels:** DM Sans, 10-11px, tracking-[0.15em]-[0.2em], uppercase, font-bold

### Heat Map Tiers

| Tier | Color | Fire threshold |
|---|---|---|
| EXPLOSIVE | #dc2743 (red) | fire >= 150 |
| UNDERGROUND | #a855f7 (purple) | fire >= 60 |
| SOCIAL CHILL | #34d399 (green) | fire >= 0 |

Blob radius: `25 + min(fire/250, 1) * 60` pixels.
Blob opacity: `0.35 + min(fire/250, 1) * 0.45`.
Radial gradient: 4 stops (full → 60% → 20% → 0 opacity).

---

## How the Heat Map Works

The map page uses **vanilla Leaflet** (not react-leaflet) with **CartoDB dark_all** tiles. Heat blobs are drawn on a **separate canvas element** positioned absolutely over the Leaflet map. On every `moveend`/`zoomend` event, the canvas clears and redraws all blobs using `map.latLngToContainerPoint()` to convert lat/lng to pixel positions.

Each blob is a radial gradient circle. Size and intensity scale linearly with fire count. Tapping a blob selects the event and shows a detail popover.

The canvas overlay has `pointer-events: auto` and sits at z-10 above the map (z-0). The header/legend float at z-20.

Map tiles: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` — free, no API key.

---

## Whop Integration

The app is designed to run inside Whop's iframe. Key setup:

1. `next.config.js` sets `X-Frame-Options: ALLOWALL` and `Content-Security-Policy: frame-ancestors *`
2. `lib/whop.ts` lazily initializes the iframe SDK via `createSdk()` from `@whop/iframe`
3. External URLs should be opened via `iframeSdk.openExternalUrl()` when inside Whop, falling back to `window.open()` outside
4. Whop App ID goes in `NEXT_PUBLIC_WHOP_APP_ID` env var
5. App Path in Whop dashboard should be `/`

---

## Signup System

`/api/signup/route.ts` stores emails in a flat `signups.json` file at the project root. GET returns `{ count }`, POST accepts `{ email }` and returns `{ ok, count }`. Emails are lowercased and deduplicated.

**This is a hackathon shortcut.** For production, replace with Supabase or Postgres.

---

## What Needs Building Next (Priority Order)

### P0 — Before the booth Monday
- [ ] Verify `npm run build` succeeds with no errors
- [ ] Deploy to Vercel: `npx vercel --prod`
- [ ] Set up Whop app at dash.whop.com, add env vars
- [ ] Generate QR code pointing to deployed URL
- [ ] Swap seed event lat/lng in `lib/events.ts` to actual campus coordinates
- [ ] Seed feed with 5-10 real events scraped from Eventbrite

### P1 — During the booth / demo improvements
- [ ] "Post a Function" form (tap the + FAB → modal with name, vibe, area, time)
- [ ] Eventbrite API integration in `/api/events/route.ts`
- [ ] Real-time signup counter on the landing page (poll every 5s or use SSE)
- [ ] Alerts tab — stub or basic "coming soon" screen
- [ ] Profile tab — stub or basic "coming soon" screen

### P2 — Post-hackathon
- [ ] Replace signups.json with Supabase
- [ ] User auth via Whop OAuth
- [ ] Real image uploads for event cards (replace gradient placeholders)
- [ ] Plotz/Partiful/Dice scraping pipeline
- [ ] Push notifications for nearby functions
- [ ] Referral queue mechanic (share link → move up in line)
- [ ] Friends on map feature (avatar stack on heat map, "3 friends at...")

---

## Commands

```bash
npm install          # Install deps (verified clean: 456 packages, 0 errors)
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
npx vercel --prod    # Deploy to Vercel
```

---

## Coding Conventions

- All pages are `"use client"` (client components for interactivity)
- Inline styles using CSS variables (not Tailwind custom theme) for the design system colors
- Font families set via inline `style={{ fontFamily: "'Bebas Neue', sans-serif" }}` — not Tailwind font classes
- Event data lives in `lib/events.ts` — single source of truth for types, configs, and seed data
- No `react-leaflet`. Leaflet is imported dynamically: `const L = (await import("leaflet")).default`
- Canvas overlays for custom rendering (heat blobs) — not Leaflet plugins
- File-based JSON for hackathon-speed persistence
