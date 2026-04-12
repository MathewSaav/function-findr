import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { FunctionEvent, Source, Vibe, VIBE_CONFIG } from "@/lib/events";

const DATA_PATH = join(process.cwd(), "user-events.json");

const VALID_VIBES: Vibe[] = ["rave", "darty", "kickback", "house", "bar", "club"];
const VALID_SOURCES: Source[] = [
  "eventbrite",
  "plotz",
  "partiful",
  "user",
  "dice",
  "campus",
  "promoter",
  "curated",
];

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_STORED_EVENTS = 120;

type FieldErrors = Partial<Record<"name" | "vibe" | "area" | "time", string>>;

type AreaCenter = {
  keywords: string[];
  lat: number;
  lng: number;
  spread: number;
};

const AREA_CENTERS: AreaCenter[] = [
  { keywords: ["sofa", "south first", "south 1st"], lat: 37.3297, lng: -121.8862, spread: 0.0045 },
  { keywords: ["san pedro", "downtown", "market", "core"], lat: 37.3362, lng: -121.893, spread: 0.0048 },
  { keywords: ["campus", "spartan", "sjsu", "near campus"], lat: 37.3366, lng: -121.881, spread: 0.0042 },
  { keywords: ["japantown", "j town", "northside"], lat: 37.3488, lng: -121.8956, spread: 0.0042 },
  { keywords: ["alameda"], lat: 37.342, lng: -121.9064, spread: 0.0042 },
  { keywords: ["midtown", "rose garden"], lat: 37.3278, lng: -121.9148, spread: 0.0055 },
  { keywords: ["willow"], lat: 37.3098, lng: -121.902, spread: 0.005 },
  { keywords: ["santana"], lat: 37.3222, lng: -121.948, spread: 0.0048 },
  { keywords: ["industrial", "west end", "warehouse"], lat: 37.3339, lng: -121.9027, spread: 0.0045 },
];

const VIBE_FALLBACK_CENTERS: Record<Vibe, AreaCenter> = {
  rave: { keywords: [], lat: 37.3337, lng: -121.9022, spread: 0.005 },
  club: { keywords: [], lat: 37.3338, lng: -121.889, spread: 0.0046 },
  darty: { keywords: [], lat: 37.338, lng: -121.8907, spread: 0.0058 },
  house: { keywords: [], lat: 37.3365, lng: -121.8815, spread: 0.0045 },
  kickback: { keywords: [], lat: 37.342, lng: -121.906, spread: 0.0048 },
  bar: { keywords: [], lat: 37.3364, lng: -121.8942, spread: 0.0046 },
};

const DRESS_LINES: Record<Vibe, string[]> = {
  rave: ["Dark layers", "Comfy shoes", "Late-night black"],
  darty: ["Day-party casual", "Sunglasses ready", "Warm-weather fits"],
  kickback: ["Lowkey casual", "Comfortable", "Soft layers"],
  house: ["Campus casual", "No-pressure fits", "Party casual"],
  bar: ["Smart casual", "Clean casual", "Date-night casual"],
  club: ["Night-out clean", "Elevated casual", "Statement jacket"],
};

const CROWD_RANGES: Record<Vibe, [number, number]> = {
  rave: [45, 110],
  darty: [35, 95],
  kickback: [15, 42],
  house: [35, 85],
  bar: [25, 70],
  club: [70, 140],
};

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidVibe(value: string): value is Vibe {
  return VALID_VIBES.includes(value as Vibe);
}

function isValidSource(value: string): value is Source {
  return VALID_SOURCES.includes(value as Source);
}

function clampText(value: unknown, maxLength: number): string | undefined {
  const normalized = normalizeText(value).slice(0, maxLength);
  return normalized || undefined;
}

function validateInput(body: unknown) {
  const errors: FieldErrors = {};
  const record = isRecord(body) ? body : {};

  const name = normalizeText(record.name).slice(0, 56);
  const area = normalizeText(record.area).slice(0, 48);
  const time = normalizeText(record.time).slice(0, 48);
  const rawVibe = normalizeText(record.vibe).toLowerCase();

  if (!name) {
    errors.name = "Add a function name.";
  } else if (name.length < 3) {
    errors.name = "Use at least 3 characters.";
  } else if (!/[a-z0-9]/i.test(name)) {
    errors.name = "Use letters or numbers.";
  }

  if (!rawVibe || !isValidVibe(rawVibe)) {
    errors.vibe = "Pick a vibe.";
  }

  if (!area) {
    errors.area = "Add a general area.";
  } else if (area.length < 2) {
    errors.area = "Use a recognizable area.";
  } else if (!/[a-z0-9]/i.test(area)) {
    errors.area = "Use letters or numbers.";
  }

  if (!time) {
    errors.time = "Add a time window.";
  } else if (time.length < 3) {
    errors.time = "Use a clearer time window.";
  } else if (!/[a-z0-9]/i.test(time)) {
    errors.time = "Use a readable time window.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: {
      name: name.toUpperCase(),
      vibe: rawVibe as Vibe,
      area,
      time,
    },
  };
}

function vibeGradient(vibe: Vibe): string {
  const hex = VIBE_CONFIG[vibe].color;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dark = `rgb(${Math.floor(r * 0.1)},${Math.floor(g * 0.1)},${Math.floor(b * 0.1)})`;
  const mid = `rgb(${Math.floor(r * 0.42)},${Math.floor(g * 0.42)},${Math.floor(b * 0.42)})`;

  return `radial-gradient(circle at 20% 18%, rgba(255,255,255,0.16), transparent 17%), linear-gradient(135deg, ${dark} 0%, ${mid} 48%, ${hex} 100%)`;
}

function eventTimestamp(event: FunctionEvent): number {
  const match = /^user-(\d+)/.exec(event.id);
  return match ? Number(match[1]) : 0;
}

function duplicateKey(name: string, area: string, time: string): string {
  return [name, area, time].map((value) => normalizeText(value).toLowerCase()).join("|");
}

function hasRecentDuplicate(events: FunctionEvent[], name: string, area: string, time: string) {
  const key = duplicateKey(name, area, time);
  const now = Date.now();

  return events.some((event) => {
    if (event.source !== "user") return false;
    if (duplicateKey(event.name, event.area, event.time) !== key) return false;
    const createdAt = eventTimestamp(event);
    return createdAt > 0 && now - createdAt < DUPLICATE_WINDOW_MS;
  });
}

function chooseAreaCenter(area: string, vibe: Vibe): AreaCenter {
  const normalizedArea = area.toLowerCase();
  return (
    AREA_CENTERS.find((center) =>
      center.keywords.some((keyword) => normalizedArea.includes(keyword))
    ) ?? VIBE_FALLBACK_CENTERS[vibe]
  );
}

function fakeCoordinates(area: string, vibe: Vibe) {
  const center = chooseAreaCenter(area, vibe);
  const latOffset = (Math.random() - 0.5) * center.spread;
  const lngOffset = (Math.random() - 0.5) * center.spread;

  return {
    lat: Number((center.lat + latOffset).toFixed(6)),
    lng: Number((center.lng + lngOffset).toFixed(6)),
  };
}

function randomBetween(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function fakeCrowd(vibe: Vibe): string {
  const [min, max] = CROWD_RANGES[vibe];
  const low = randomBetween(min, Math.max(min, max - 22));
  const high = randomBetween(Math.max(low + 10, min + 12), max);
  return `${low}-${high} expected`;
}

function fakeDress(vibe: Vibe): string {
  const options = DRESS_LINES[vibe];
  return options[Math.floor(Math.random() * options.length)];
}

function fakeDescription(vibe: Vibe, area: string): string {
  const copy: Record<Vibe, string> = {
    rave: `User-submitted late-night sound around ${area}. Expect a darker room and a moving crowd.`,
    darty: `Day-party energy around ${area} with groups rolling through before the night plans form.`,
    kickback: `Lowkey hang around ${area} with a smaller guest list and friend-of-friend energy.`,
    house: `Campus-style house function around ${area} with music, porch traffic, and a casual door.`,
    bar: `Easy bar move around ${area} for drinks, meetups, and a clean launch point.`,
    club: `Night-out listing around ${area} with dance-floor energy and a later peak.`,
  };

  return copy[vibe];
}

function startingFire(vibe: Vibe): number {
  const ranges: Record<Vibe, [number, number]> = {
    rave: [54, 96],
    club: [62, 112],
    darty: [44, 88],
    house: [38, 82],
    bar: [30, 70],
    kickback: [18, 54],
  };
  const [min, max] = ranges[vibe];
  return randomBetween(min, max);
}

function normalizeStoredEvent(value: unknown): FunctionEvent | null {
  if (!isRecord(value)) return null;

  const id = normalizeText(value.id);
  const name = normalizeText(value.name);
  const vibe = normalizeText(value.vibe).toLowerCase();
  const area = normalizeText(value.area);
  const time = normalizeText(value.time);
  const source = normalizeText(value.source).toLowerCase();
  const lat = Number(value.lat);
  const lng = Number(value.lng);

  if (!id || !name || !isValidVibe(vibe) || !area || !time) return null;

  const fallbackCoordinates =
    Number.isFinite(lat) && Number.isFinite(lng) ? null : fakeCoordinates(area, vibe);

  return {
    id,
    name: name.toUpperCase(),
    vibe,
    area,
    time,
    source: isValidSource(source) ? source : "user",
    fire: Math.max(0, Math.min(Number(value.fire) || 0, 999)),
    lat: Number.isFinite(lat) ? lat : fallbackCoordinates!.lat,
    lng: Number.isFinite(lng) ? lng : fallbackCoordinates!.lng,
    gradient: normalizeText(value.gradient) || vibeGradient(vibe),
    description: clampText(value.description, 180),
    crowd: clampText(value.crowd, 32),
    dress: clampText(value.dress, 32),
    host: clampText(value.host, 48),
  };
}

function getEvents(): FunctionEvent[] {
  if (!existsSync(DATA_PATH)) return [];

  try {
    const parsed = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeStoredEvent)
      .filter((event): event is FunctionEvent => Boolean(event))
      .sort((a, b) => eventTimestamp(b) - eventTimestamp(a));
  } catch {
    return [];
  }
}

function saveEvents(events: FunctionEvent[]) {
  const trimmed = events
    .sort((a, b) => eventTimestamp(a) - eventTimestamp(b))
    .slice(-MAX_STORED_EVENTS);
  writeFileSync(DATA_PATH, JSON.stringify(trimmed, null, 2));
}

export async function GET() {
  return NextResponse.json({ events: getEvents() });
}

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not read that submission. Try again." },
      { status: 400 }
    );
  }

  const result = validateInput(body);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "Fix the highlighted fields.", fields: result.errors },
      { status: 400 }
    );
  }

  const { name, vibe, area, time } = result.values;
  const events = getEvents();

  if (hasRecentDuplicate(events, name, area, time)) {
    return NextResponse.json(
      {
        ok: false,
        error: "That same function was just posted. Give it a few minutes before reposting.",
        fields: { name: "Duplicate recent post." },
      },
      { status: 409 }
    );
  }

  const { lat, lng } = fakeCoordinates(area, vibe);
  const event: FunctionEvent = {
    id: `user-${Date.now()}`,
    name,
    vibe,
    area,
    time,
    source: "user",
    fire: startingFire(vibe),
    lat,
    lng,
    gradient: vibeGradient(vibe),
    description: fakeDescription(vibe, area),
    crowd: fakeCrowd(vibe),
    dress: fakeDress(vibe),
    host: "User Submitted",
  };

  try {
    saveEvents([...events, event]);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not save the function locally. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, event }, { status: 201 });
}
