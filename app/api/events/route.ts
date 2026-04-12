import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { FunctionEvent, Vibe, VIBE_CONFIG } from "@/lib/events";

const DATA_PATH = join(process.cwd(), "user-events.json");

const VALID_VIBES: Vibe[] = ["rave", "darty", "kickback", "house", "bar", "club"];

// Campus center
const CENTER_LAT = 37.335;
const CENTER_LNG = -121.893;

// Generate a gradient based on vibe color
function vibeGradient(vibe: Vibe): string {
  const hex = VIBE_CONFIG[vibe].color;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dark = `rgb(${Math.floor(r * 0.1)},${Math.floor(g * 0.1)},${Math.floor(b * 0.1)})`;
  const mid = `rgb(${Math.floor(r * 0.4)},${Math.floor(g * 0.4)},${Math.floor(b * 0.4)})`;
  return `linear-gradient(135deg, ${dark} 0%, ${mid} 50%, ${hex} 100%)`;
}

function getEvents(): FunctionEvent[] {
  if (!existsSync(DATA_PATH)) return [];
  try {
    return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function saveEvents(events: FunctionEvent[]) {
  writeFileSync(DATA_PATH, JSON.stringify(events, null, 2));
}

export async function GET() {
  return NextResponse.json({ events: getEvents() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, vibe, area, time } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ ok: false, error: "Name required" }, { status: 400 });
  }
  if (!vibe || !VALID_VIBES.includes(vibe)) {
    return NextResponse.json({ ok: false, error: "Invalid vibe" }, { status: 400 });
  }
  if (!area || typeof area !== "string") {
    return NextResponse.json({ ok: false, error: "Area required" }, { status: 400 });
  }
  if (!time || typeof time !== "string") {
    return NextResponse.json({ ok: false, error: "Time required" }, { status: 400 });
  }

  const event: FunctionEvent = {
    id: `user-${Date.now()}`,
    name: name.toUpperCase(),
    vibe,
    area,
    time,
    source: "user",
    fire: 1,
    lat: CENTER_LAT + (Math.random() - 0.5) * 0.02,
    lng: CENTER_LNG + (Math.random() - 0.5) * 0.02,
    gradient: vibeGradient(vibe),
  };

  const events = getEvents();
  events.push(event);
  saveEvents(events);

  return NextResponse.json({ ok: true, event });
}
