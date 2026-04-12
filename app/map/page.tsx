"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { SEED_EVENTS, FunctionEvent, VIBE_CONFIG, HEAT_TIERS } from "@/lib/events";
import type L from "leaflet";

// Dynamically import Leaflet (client only)
async function loadLeaflet() {
  const L = (await import("leaflet")).default;
  await import("leaflet/dist/leaflet.css");
  return L;
}

// Map center — San Jose State area
const CENTER: [number, number] = [37.335, -121.893];
const ZOOM = 14;

// Scale fire count → blob radius in pixels
function fireToRadius(fire: number): number {
  // 0→25px, 100→55px, 250+→85px
  return 25 + Math.min(fire / 250, 1) * 60;
}

// Scale fire count → opacity
function fireToOpacity(fire: number): number {
  return 0.35 + Math.min(fire / 250, 1) * 0.45;
}

// Pick color based on fire count
function fireToColor(fire: number): string {
  for (const tier of HEAT_TIERS) {
    if (fire >= tier.minFire) return tier.color;
  }
  return HEAT_TIERS[HEAT_TIERS.length - 1].color;
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const [selected, setSelected] = useState<FunctionEvent | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const events = SEED_EVENTS;

  const filteredEvents = filter === "all"
    ? events
    : events.filter((e) => e.vibe === filter);

  // Draw heat blobs on the overlay canvas
  const drawHeat = useCallback(() => {
    const map = mapRef.current;
    const canvas = canvasRef.current;
    const Lf = leafletRef.current;
    if (!map || !canvas || !Lf) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const eventsToRender = filter === "all"
      ? events
      : events.filter((e) => e.vibe === filter);

    eventsToRender.forEach((ev) => {
      const point = map.latLngToContainerPoint(Lf.latLng(ev.lat, ev.lng));
      const x = point.x;
      const y = point.y;
      const radius = fireToRadius(ev.fire);
      const opacity = fireToOpacity(ev.fire);
      const color = fireToColor(ev.fire);

      // Parse hex to RGB
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      // Outer glow
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, `rgba(${r},${g},${b},${opacity})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${opacity * 0.6})`);
      grad.addColorStop(0.7, `rgba(${r},${g},${b},${opacity * 0.2})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(opacity + 0.3, 1)})`;
      ctx.beginPath();
      ctx.arc(x, y, 4 + (ev.fire / 250) * 3, 0, Math.PI * 2);
      ctx.fill();

      // White center
      ctx.fillStyle = `rgba(255,255,255,${opacity * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [events, filter]);

  // Init Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !mapContainerRef.current) return;
      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: CENTER,
        zoom: ZOOM,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark tiles — CartoDB dark_all (open source, no key needed)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map);

      mapRef.current = map;

      // Redraw heat on every move
      map.on("moveend", drawHeat);
      map.on("zoomend", drawHeat);

      // Initial draw after tiles load
      setTimeout(drawHeat, 300);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [drawHeat]);

  // Redraw when filter changes
  useEffect(() => {
    drawHeat();
  }, [filter, drawHeat]);

  // Handle tap on canvas
  function handleCanvasTap(e: React.MouseEvent<HTMLCanvasElement>) {
    const map = mapRef.current;
    const Lf = leafletRef.current;
    if (!map || !Lf) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    let closest: FunctionEvent | null = null;
    let closestDist = 50;

    filteredEvents.forEach((ev) => {
      const point = map.latLngToContainerPoint(Lf.latLng(ev.lat, ev.lng));
      const dist = Math.sqrt((cx - point.x) ** 2 + (cy - point.y) ** 2);
      if (dist < closestDist) {
        closest = ev;
        closestDist = dist;
      }
    });

    setSelected(closest);
  }

  const FILTER_CHIPS = [
    { key: "all", label: "ALL ENERGY" },
    { key: "rave", label: "RAVES" },
    { key: "club", label: "CLUBS" },
    { key: "darty", label: "DARTIES" },
    { key: "kickback", label: "KICKBACKS" },
    { key: "bar", label: "BARS" },
  ];

  return (
    <div className="relative" style={{ height: "calc(100vh - 5rem)" }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 pb-2 space-y-3" style={{ background: "linear-gradient(to bottom, var(--bg) 60%, transparent)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--accent)", fontSize: "20px" }}>⚡</span>
            <span className="text-xl tracking-wider font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", color: "var(--accent)" }}>
              FINDR
            </span>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm" style={{ background: "var(--bg-card-elevated)", border: "1px solid var(--border)" }}>
            👤
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            SEARCH THE PULSE...
          </div>
          <button
            className="flex items-center justify-center w-11 rounded-xl"
            style={{ background: "var(--accent)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {FILTER_CHIPS.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className="shrink-0 text-[11px] font-bold tracking-wider px-3.5 py-1.5 rounded-full transition-all"
              style={
                filter === c.key
                  ? { background: "var(--accent)", color: "#fff" }
                  : { background: "var(--bg-card)", color: "var(--text-dim)", border: "1px solid var(--border)" }
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaflet map */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Heat canvas overlay */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasTap}
        className="absolute inset-0 z-10 cursor-pointer"
        style={{ pointerEvents: "auto" }}
      />

      {/* Legend */}
      <div
        className="absolute bottom-4 left-4 z-20 px-4 py-3 rounded-xl space-y-1.5"
        style={{ background: "rgba(12,10,14,0.85)", backdropFilter: "blur(12px)", border: "1px solid var(--border)" }}
      >
        <p className="text-[10px] font-bold tracking-[0.15em]" style={{ color: "var(--text-dim)" }}>
          REAL-TIME VIBE
        </p>
        {HEAT_TIERS.map((tier) => (
          <div key={tier.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: tier.color, boxShadow: `0 0 6px ${tier.color}` }} />
            <span className="text-[11px] font-semibold tracking-wider" style={{ color: "var(--text-dim)" }}>
              {tier.label}
            </span>
          </div>
        ))}
      </div>

      {/* Selected event popover */}
      {selected && (
        <div
          className="absolute bottom-20 left-4 right-4 z-30 rounded-2xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", backdropFilter: "blur(16px)" }}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="font-bold text-lg tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {selected.name}
              </p>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-dim)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)" stroke="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" fill="var(--bg-card)" /></svg>
                {selected.area} · {selected.time}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full"
                  style={{ color: VIBE_CONFIG[selected.vibe].color, background: VIBE_CONFIG[selected.vibe].color + "20" }}
                >
                  {VIBE_CONFIG[selected.vibe].label}
                </span>
                <span className="text-xs font-bold" style={{ color: "var(--text-dim)" }}>
                  🔥 {selected.fire}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-xl leading-none p-1"
              style={{ color: "var(--text-muted)" }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
