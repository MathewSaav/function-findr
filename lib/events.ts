export type Vibe = "rave" | "darty" | "kickback" | "house" | "bar" | "club";
export type Source = "eventbrite" | "plotz" | "partiful" | "user" | "dice";

export interface FunctionEvent {
  id: string;
  name: string;
  vibe: Vibe;
  area: string;
  time: string;
  source: Source;
  fire: number;
  lat: number;
  lng: number;
  gradient: string; // CSS gradient for card hero
}

export const VIBE_CONFIG: Record<Vibe, { label: string; color: string }> = {
  rave:     { label: "RAVE",         color: "#dc2743" },
  darty:    { label: "DARTY",        color: "#f0854a" },
  kickback: { label: "KICKBACK",     color: "#34d399" },
  house:    { label: "HOUSE PARTY",  color: "#f472b6" },
  bar:      { label: "BAR NIGHT",    color: "#60a5fa" },
  club:     { label: "CLUB EVENT",   color: "#a855f7" },
};

export const SOURCE_CONFIG: Record<Source, { label: string; color: string; bg: string }> = {
  partiful:   { label: "PARTIFUL",       color: "#fff", bg: "#dc2743" },
  eventbrite: { label: "EVENTBRITE",     color: "#fff", bg: "#f0854a" },
  plotz:      { label: "PLOTZ",          color: "#fff", bg: "#a855f7" },
  user:       { label: "USER SUBMITTED", color: "#fff", bg: "#0ea5e9" },
  dice:       { label: "DICE",           color: "#fff", bg: "#38bdf8" },
};

// Intensity tiers for heat map legend
export const HEAT_TIERS = [
  { label: "EXPLOSIVE",   color: "#dc2743", minFire: 150 },
  { label: "UNDERGROUND", color: "#a855f7", minFire: 60 },
  { label: "SOCIAL CHILL",color: "#34d399", minFire: 0 },
];

// Seed events — adjust lat/lng to your campus
export const SEED_EVENTS: FunctionEvent[] = [
  { id: "1",  name: "NEON VOID: WAREHOUSE RAVE", vibe: "rave",     area: "West End Industrial", time: "11:00 PM — 5:00 AM", source: "partiful",   fire: 142, lat: 37.335, lng: -121.893, gradient: "linear-gradient(135deg, #1a0000 0%, #4a0e0e 40%, #8b1a1a 70%, #dc2743 100%)" },
  { id: "2",  name: "SUN-DRENCHED KICKBACK",     vibe: "darty",    area: "The Hills",          time: "2:00 PM — 8:00 PM",  source: "eventbrite", fire: 85,  lat: 37.321, lng: -121.948, gradient: "linear-gradient(135deg, #1a1500 0%, #4a3a0e 40%, #b8860b 70%, #f0854a 100%)" },
  { id: "3",  name: "VINYL & NATURAL WINE",      vibe: "kickback", area: "Echo Park",          time: "8:00 PM — 1:00 AM",  source: "user",       fire: 56,  lat: 37.332, lng: -121.884, gradient: "linear-gradient(135deg, #0a1a0f 0%, #1a3a2a 40%, #2d6a4f 70%, #34d399 100%)" },
  { id: "4",  name: "BRKN BASS",                 vibe: "club",     area: "South 1st St",       time: "11:00 PM — 3:00 AM", source: "dice",       fire: 201, lat: 37.327, lng: -121.882, gradient: "linear-gradient(135deg, #0f0a1a 0%, #2a1a4a 40%, #6b21a8 70%, #a855f7 100%)" },
  { id: "5",  name: "GOLDEN HOUR ROOFTOP",       vibe: "darty",    area: "Santana Row",        time: "3:00 PM — 7:00 PM",  source: "plotz",      fire: 89,  lat: 37.322, lng: -121.947, gradient: "linear-gradient(135deg, #1a1200 0%, #4a3510 40%, #c2853a 70%, #f0854a 100%)" },
  { id: "6",  name: "BLACKOUT FRIDAYS",          vibe: "club",     area: "San Pedro Square",   time: "10:00 PM — 2:00 AM", source: "eventbrite", fire: 178, lat: 37.337, lng: -121.895, gradient: "linear-gradient(135deg, #0c0a0e 0%, #2e1020 40%, #6b1035 70%, #dc2743 100%)" },
  { id: "7",  name: "DAY ONES ONLY",             vibe: "house",    area: "Near Campus",        time: "9:00 PM — 1:00 AM",  source: "user",       fire: 66,  lat: 37.336, lng: -121.881, gradient: "linear-gradient(135deg, #1a0a15 0%, #3a1a30 40%, #9d4a7a 70%, #f472b6 100%)" },
  { id: "8",  name: "MEZCAL TERRACE",            vibe: "bar",      area: "Downtown SJ",        time: "7:00 PM — 11:00 PM", source: "partiful",   fire: 93,  lat: 37.334, lng: -121.890, gradient: "linear-gradient(135deg, #0a0f1a 0%, #1a2a4a 40%, #3a5a8a 70%, #60a5fa 100%)" },
  { id: "9",  name: "FOAM PARTY",                vibe: "rave",     area: "DTSJ Warehouse",     time: "11:00 PM — 4:00 AM", source: "eventbrite", fire: 256, lat: 37.330, lng: -121.888, gradient: "linear-gradient(135deg, #1a0005 0%, #4a0015 40%, #8b0a2a 70%, #dc2743 100%)" },
  { id: "10", name: "SUNSET SESSION",            vibe: "darty",    area: "Japantown",          time: "2:00 PM — 6:00 PM",  source: "plotz",      fire: 72,  lat: 37.349, lng: -121.895, gradient: "linear-gradient(135deg, #1a1000 0%, #3a2800 40%, #8a6020 70%, #fbbf24 100%)" },
  { id: "11", name: "AFTER DARK",                vibe: "club",     area: "The Alameda",        time: "10:00 PM — 2:00 AM", source: "dice",       fire: 134, lat: 37.343, lng: -121.907, gradient: "linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 40%, #4a2a6a 70%, #a855f7 100%)" },
  { id: "12", name: "KYLE'S KICKBACK",           vibe: "house",    area: "Spartan Village",    time: "8:00 PM — 12:00 AM", source: "user",       fire: 48,  lat: 37.338, lng: -121.878, gradient: "linear-gradient(135deg, #1a0a10 0%, #2a1520 40%, #6a3050 70%, #f472b6 100%)" },
];
