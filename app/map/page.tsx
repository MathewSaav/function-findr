"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FunctionEvent,
  HEAT_TIERS,
  SEED_EVENTS,
  SOURCE_CATEGORY_CONFIG,
  SOURCE_CONFIG,
  VIBE_CONFIG,
  Vibe,
} from "@/lib/events";
import type L from "leaflet";
import type { LeafletMouseEvent } from "leaflet";

// Dynamically import Leaflet on the client.
async function loadLeaflet() {
  const L = (await import("leaflet")).default;
  await import("leaflet/dist/leaflet.css");
  return L;
}

type FilterKey = Vibe | "all";
type ZoneSelection = {
  anchor: [number, number];
  events: FunctionEvent[];
  totalFire: number;
};

// General San Jose State / downtown demo center.
const CENTER: [number, number] = [37.335, -121.893];
const ZOOM = 14;

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "ALL ENERGY" },
  { key: "rave", label: "RAVES" },
  { key: "club", label: "CLUBS" },
  { key: "darty", label: "DARTIES" },
  { key: "house", label: "HOUSE" },
  { key: "kickback", label: "KICKBACKS" },
  { key: "bar", label: "BARS" },
];

function fireToRadius(fire: number): number {
  return Math.min(30 + Math.sqrt(Math.max(fire, 1)) * 4.15, 98);
}

function fireToOpacity(fire: number): number {
  return 0.22 + Math.min(fire / 280, 1) * 0.42;
}

function fireToColor(fire: number): string {
  for (const tier of HEAT_TIERS) {
    if (fire >= tier.minFire) return tier.color;
  }
  return HEAT_TIERS[HEAT_TIERS.length - 1].color;
}

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const filteredEventsRef = useRef<FunctionEvent[]>(SEED_EVENTS);
  const animationFrameRef = useRef<number | null>(null);

  const [selectedZone, setSelectedZone] = useState<ZoneSelection | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [userEvents, setUserEvents] = useState<FunctionEvent[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [loadingUserEvents, setLoadingUserEvents] = useState(true);

  const events = useMemo(() => [...SEED_EVENTS, ...userEvents], [userEvents]);

  const filteredEvents = useMemo(() => {
    const visible = filter === "all" ? events : events.filter((event) => event.vibe === filter);
    return [...visible].sort((a, b) => b.fire - a.fire);
  }, [events, filter]);

  const hottestEvents = filteredEvents.slice(0, 3);
  const selectedEvents = selectedZone?.events ?? hottestEvents;

  const drawHeat = useCallback((time = performance.now()) => {
    const map = mapRef.current;
    const canvas = canvasRef.current;
    const Lf = leafletRef.current;
    if (!map || !canvas || !Lf) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const visibleEvents = filteredEventsRef.current;
    if (visibleEvents.length === 0) return;

    ctx.globalCompositeOperation = "lighter";

    [...visibleEvents]
      .sort((a, b) => a.fire - b.fire)
      .forEach((event, index) => {
        const point = map.latLngToContainerPoint(Lf.latLng(event.lat, event.lng));
        const radius = fireToRadius(event.fire);
        if (
          point.x < -radius ||
          point.x > rect.width + radius ||
          point.y < -radius ||
          point.y > rect.height + radius
        ) {
          return;
        }

        const pulse = 1 + Math.sin(time / 1100 + index * 0.9) * 0.045;
        const glowRadius = radius * pulse;
        const hazeRadius = glowRadius * 1.55;
        const opacity = fireToOpacity(event.fire);
        const { r, g, b } = hexToRgb(fireToColor(event.fire));

        const haze = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, hazeRadius);
        haze.addColorStop(0, `rgba(${r},${g},${b},${opacity * 0.24})`);
        haze.addColorStop(0.55, `rgba(${r},${g},${b},${opacity * 0.11})`);
        haze.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = haze;
        ctx.beginPath();
        ctx.arc(point.x, point.y, hazeRadius, 0, Math.PI * 2);
        ctx.fill();

        const core = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, glowRadius);
        core.addColorStop(0, `rgba(255,255,255,${Math.min(opacity + 0.1, 0.82)})`);
        core.addColorStop(0.12, `rgba(${r},${g},${b},${opacity})`);
        core.addColorStop(0.48, `rgba(${r},${g},${b},${opacity * 0.52})`);
        core.addColorStop(0.78, `rgba(${r},${g},${b},${opacity * 0.16})`);
        core.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(point.x, point.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(255,255,255,${0.48 + Math.min(event.fire / 300, 0.32)})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, event.fire > 150 ? 3.5 : 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "lighter";
      });

    ctx.globalCompositeOperation = "source-over";
  }, []);

  const requestDraw = useCallback(() => {
    if (animationFrameRef.current) return;
    animationFrameRef.current = requestAnimationFrame((time) => {
      animationFrameRef.current = null;
      drawHeat(time);
    });
  }, [drawHeat]);

  const selectEventsNearPoint = useCallback(
    (clickPoint: L.Point, latlng: L.LatLng) => {
      const map = mapRef.current;
      const Lf = leafletRef.current;
      if (!map || !Lf) return;

      const scored = filteredEventsRef.current
        .map((event) => {
          const point = map.latLngToContainerPoint(Lf.latLng(event.lat, event.lng));
          return {
            event,
            distance: distance(clickPoint, point),
            radius: fireToRadius(event.fire),
          };
        })
        .filter(({ distance, radius }) => distance <= Math.max(44, radius * 0.72))
        .sort((a, b) => a.distance - b.distance || b.event.fire - a.event.fire);

      if (scored.length === 0) {
        setSelectedZone(null);
        return;
      }

      const zoneEvents = scored
        .slice(0, 7)
        .map(({ event }) => event)
        .sort((a, b) => b.fire - a.fire);

      setSelectedZone({
        anchor: [latlng.lat, latlng.lng],
        events: zoneEvents,
        totalFire: zoneEvents.reduce((sum, event) => sum + event.fire, 0),
      });
    },
    []
  );

  useEffect(() => {
    fetch("/api/events")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.events)) {
          setUserEvents(data.events);
        }
      })
      .catch(() => {
        setUserEvents([]);
      })
      .finally(() => {
        setLoadingUserEvents(false);
      });
  }, []);

  useEffect(() => {
    function handleCreated(event: Event) {
      const created = (event as CustomEvent<FunctionEvent>).detail;
      if (!created?.id) return;
      setUserEvents((prev) => [created, ...prev.filter((existing) => existing.id !== created.id)]);
    }

    window.addEventListener("function-findr:event-created", handleCreated);
    return () => window.removeEventListener("function-findr:event-created", handleCreated);
  }, []);

  useEffect(() => {
    filteredEventsRef.current = filteredEvents;
    setSelectedZone(null);
    requestDraw();
  }, [filteredEvents, requestDraw]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    loadLeaflet()
      .then((Leaflet) => {
        if (cancelled || !mapContainerRef.current) return;
        leafletRef.current = Leaflet;

        const map = Leaflet.map(mapContainerRef.current, {
          center: CENTER,
          zoom: ZOOM,
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true,
          minZoom: 12,
          maxZoom: 17,
        });

        mapRef.current = map;

        // CartoDB dark tiles do not require an app API key; Mapbox is unnecessary here.
        const tileLayer = Leaflet.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          { maxZoom: 19 }
        ).addTo(map);

        tileLayer.on("load", () => {
          setTilesReady(true);
          requestDraw();
        });

        tileLayer.on("tileerror", () => {
          setTileError(true);
          setTilesReady(true);
          requestDraw();
        });

        map.on("load", () => {
          setMapReady(true);
          requestDraw();
        });

        map.on("move zoom resize", requestDraw);
        map.on("click", (event: LeafletMouseEvent) => {
          const point = map.latLngToContainerPoint(event.latlng);
          selectEventsNearPoint(point, event.latlng);
        });

        setMapReady(true);
        setTimeout(() => {
          map.invalidateSize();
          requestDraw();
        }, 150);
      })
      .catch(() => {
        setMapError("Map could not load. The event data is still available below.");
      });

    return () => {
      cancelled = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [requestDraw, selectEventsNearPoint]);

  useEffect(() => {
    if (!mapReady) return;

    let frame = 0;
    let lastDraw = 0;
    const animate = (time: number) => {
      if (time - lastDraw > 90) {
        drawHeat(time);
        lastDraw = time;
      }
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [drawHeat, mapReady]);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: "calc(100vh - 5rem)",
        background:
          "radial-gradient(circle at 30% 20%, rgba(220,39,67,0.16), transparent 24%), var(--bg)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 pb-4 space-y-3"
        style={{
          background:
            "linear-gradient(to bottom, rgba(12,10,14,0.98) 0%, rgba(12,10,14,0.88) 68%, transparent 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--accent)", fontSize: "20px" }}>⚡</span>
              <span
                className="text-xl tracking-wider font-bold"
                style={{ fontFamily: "'Bebas Neue', sans-serif", color: "var(--accent)" }}
              >
                FINDR
              </span>
            </div>
            <p
              className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: "var(--text-muted)" }}
            >
              CAMPUS + IMPORTED + COMMUNITY
            </p>
          </div>
          <div
            className="rounded-full px-3 py-1.5 text-xs font-bold"
            style={{
              background: "rgba(26,17,24,0.86)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            {filteredEvents.length} LIVE
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {FILTER_CHIPS.map((chip) => {
            const active = filter === chip.key;
            const color = chip.key === "all" ? "var(--accent)" : VIBE_CONFIG[chip.key].color;
            return (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key)}
                className="shrink-0 rounded-full px-3.5 py-2 text-[11px] font-bold tracking-wider transition-all active:scale-95"
                style={
                  active
                    ? {
                        background: color,
                        color: "#fff",
                        boxShadow: `0 0 22px ${color}55`,
                      }
                    : {
                        background: "rgba(26,17,24,0.82)",
                        color: "var(--text-dim)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(135deg, #070609 0%, #100b11 45%, #0b1019 100%)",
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            "linear-gradient(to bottom, rgba(12,10,14,0.18) 0%, transparent 34%, transparent 58%, rgba(12,10,14,0.72) 100%)",
        }}
      />

      <div
        className="absolute left-4 top-36 z-30 rounded-2xl px-3.5 py-3"
        style={{
          background: "rgba(12,10,14,0.76)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p
          className="mb-2 text-[9px] font-bold tracking-[0.18em]"
          style={{ color: "var(--text-muted)" }}
        >
          HEAT INDEX
        </p>
        <div className="space-y-1.5">
          {HEAT_TIERS.map((tier) => (
            <div key={tier.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: tier.color,
                  boxShadow: `0 0 12px ${tier.color}`,
                }}
              />
              <span
                className="text-[10px] font-bold tracking-wider"
                style={{ color: "var(--text-dim)" }}
              >
                {tier.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {(!mapReady || (!tilesReady && !tileError)) && !mapError && (
        <div className="absolute inset-x-4 top-52 z-40 rounded-2xl p-4" style={{ background: "rgba(12,10,14,0.86)", border: "1px solid var(--border)", backdropFilter: "blur(16px)" }}>
          <p className="font-display text-xl tracking-wide" style={{ color: "var(--text)" }}>
            WARMING UP THE MAP
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-dim)" }}>
            Loading the dark city grid and plotting tonight's mock pulse.
          </p>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-x-4 top-52 z-40 rounded-2xl p-4" style={{ background: "rgba(12,10,14,0.9)", border: "1px solid var(--border)", backdropFilter: "blur(16px)" }}>
          <p className="font-display text-xl tracking-wide" style={{ color: "var(--accent)" }}>
            MAP FALLBACK
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-dim)" }}>
            {mapError}
          </p>
        </div>
      )}

      {tileError && !mapError && (
        <div
          className="absolute right-4 top-36 z-30 max-w-[12rem] rounded-2xl px-3 py-2 text-xs"
          style={{
            background: "rgba(12,10,14,0.76)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--text-dim)",
            backdropFilter: "blur(16px)",
          }}
        >
          Dark tiles are unavailable; heat data is still live.
        </div>
      )}

      {filteredEvents.length === 0 && mapReady && (
        <div className="absolute inset-x-4 bottom-24 z-40 rounded-2xl p-4" style={{ background: "rgba(12,10,14,0.9)", border: "1px solid var(--border)", backdropFilter: "blur(16px)" }}>
          <p className="font-display text-xl tracking-wide" style={{ color: "var(--text)" }}>
            NO HEAT IN THIS FILTER
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-dim)" }}>
            Try all energy or post a function to seed this vibe.
          </p>
        </div>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-5"
        style={{
          background:
            "linear-gradient(to top, rgba(12,10,14,0.98) 0%, rgba(12,10,14,0.9) 78%, transparent 100%)",
        }}
      >
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgba(26,17,24,0.88)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.42)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: "var(--accent)" }}
              >
                {selectedZone ? "SELECTED HEAT ZONE" : "HOTTEST NEARBY"}
              </p>
              <h2 className="font-display mt-1 text-2xl tracking-wide leading-none">
                {selectedZone
                  ? `${selectedZone.events.length} MOVES FOUND`
                  : loadingUserEvents
                    ? "LOADING THE PULSE"
                    : "TONIGHT'S TOP GLOWS"}
              </h2>
            </div>
            <div className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "var(--accent-soft)", color: "var(--text)" }}>
              🔥 {selectedZone ? selectedZone.totalFire : hottestEvents.reduce((sum, event) => sum + event.fire, 0)}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event) => {
                const vibe = VIBE_CONFIG[event.vibe];
                const source = SOURCE_CONFIG[event.source];
                const category = SOURCE_CATEGORY_CONFIG[source.category];
                return (
                  <button
                    key={event.id}
                    onClick={() => {
                      const Lf = leafletRef.current;
                      const map = mapRef.current;
                      if (!Lf || !map) return;
                      map.flyTo(Lf.latLng(event.lat, event.lng), Math.max(map.getZoom(), 15), {
                        duration: 0.45,
                      });
                      setSelectedZone({
                        anchor: [event.lat, event.lng],
                        events: [event],
                        totalFire: event.fire,
                      });
                    }}
                    className="w-full rounded-xl px-3 py-3 text-left transition-transform active:scale-[0.98]"
                    style={{
                      background: "rgba(34,24,32,0.9)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold tracking-wide" style={{ color: "var(--text)" }}>
                          {event.name}
                        </p>
                        <p className="mt-1 truncate text-xs" style={{ color: "var(--text-dim)" }}>
                          {event.area} · {event.time}
                        </p>
                        <p className="mt-1 truncate text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {source.cue} · {source.detailLabel}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold" style={{ color: "var(--text)" }}>
                        🔥 {event.fire}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-1 text-[9px] font-bold tracking-wider"
                        style={{
                          color: vibe.color,
                          background: vibe.color + "20",
                          border: `1px solid ${vibe.color}40`,
                        }}
                      >
                        {vibe.label}
                      </span>
                      <span
                        className="rounded-full px-2 py-1 text-[9px] font-bold tracking-wider"
                        style={{ color: source.color, background: source.bg }}
                      >
                        {source.detailLabel}
                      </span>
                      <span
                        className="rounded-full px-2 py-1 text-[9px] font-bold tracking-wider"
                        style={{ color: category.color, background: category.bg }}
                      >
                        {category.label}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="rounded-xl px-3 py-4 text-sm" style={{ background: "rgba(34,24,32,0.9)", color: "var(--text-dim)" }}>
                No events match this view yet.
              </p>
            )}
          </div>

          {selectedZone && (
            <button
              onClick={() => setSelectedZone(null)}
              className="mt-3 w-full rounded-xl py-2.5 text-xs font-bold tracking-wider transition-transform active:scale-[0.98]"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-dim)",
                background: "transparent",
              }}
            >
              CLEAR SELECTION
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
