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
import SourceLogo from "@/components/SourceLogo";
import "mapbox-gl/dist/mapbox-gl.css";

// Dynamically import Mapbox GL JS on the client.
async function loadMapbox() {
  const mapboxgl = (await import("mapbox-gl")).default;
  return mapboxgl;
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
const MAPBOX_DARK_STYLE = "mapbox://styles/mapbox/dark-v11";
const MAPBOX_STATIC_STYLE = "mapbox/dark-v11";
const MAPBOX_STATIC_MAX_SIZE = 1280;

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
  return Math.min(30 + Math.sqrt(Math.max(fire, 1)) * 4.15, 72);
}

function fireToOpacity(fire: number): number {
  return 0.18 + Math.min(fire / 280, 1) * 0.37;
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

function lngLatToWorld(lng: number, lat: number, zoom: number) {
  const sin = Math.sin((lat * Math.PI) / 180);
  const scale = 512 * 2 ** zoom;

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function projectStaticPoint(lng: number, lat: number, width: number, height: number) {
  const center = lngLatToWorld(CENTER[1], CENTER[0], ZOOM);
  const point = lngLatToWorld(lng, lat, ZOOM);

  return {
    x: width / 2 + point.x - center.x,
    y: height / 2 + point.y - center.y,
  };
}

function buildStaticMapUrl(token: string, width: number, height: number) {
  if (!token) return null;

  const imageWidth = Math.min(MAPBOX_STATIC_MAX_SIZE, Math.max(320, Math.ceil(width)));
  const imageHeight = Math.min(MAPBOX_STATIC_MAX_SIZE, Math.max(320, Math.ceil(height)));
  const center = `${CENTER[1]},${CENTER[0]},${ZOOM},0`;

  return `https://api.mapbox.com/styles/v1/${MAPBOX_STATIC_STYLE}/static/${center}/${imageWidth}x${imageHeight}@2x?access_token=${encodeURIComponent(token)}`;
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const filteredEventsRef = useRef<FunctionEvent[]>(SEED_EVENTS);
  const animationFrameRef = useRef<number | null>(null);

  const [selectedZone, setSelectedZone] = useState<ZoneSelection | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [panelOpen, setPanelOpen] = useState(false);
  const [userEvents, setUserEvents] = useState<FunctionEvent[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [staticMapActive, setStaticMapActive] = useState(false);
  const [staticMapUrl, setStaticMapUrl] = useState<string | null>(null);
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
    if (!canvas) return;

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

    ctx.globalCompositeOperation = "screen";

    [...visibleEvents]
      .sort((a, b) => a.fire - b.fire)
      .forEach((event, index) => {
        const point = map
          ? map.project([event.lng, event.lat])
          : projectStaticPoint(event.lng, event.lat, rect.width, rect.height);
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
        const hazeRadius = glowRadius * (event.fire > 150 ? 1.25 : 1.55);
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
        ctx.globalCompositeOperation = "screen";
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
    (clickPoint: { x: number; y: number }, latlng: { lat: number; lng: number }) => {
      const map = mapRef.current;
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();

      const scored = filteredEventsRef.current
        .map((event) => {
          const point = map
            ? map.project([event.lng, event.lat])
            : rect
              ? projectStaticPoint(event.lng, event.lat, rect.width, rect.height)
              : null;
          if (!point) return null;
          return {
            event,
            distance: distance(clickPoint, point),
            radius: fireToRadius(event.fire),
          };
        })
        .filter((item): item is { event: FunctionEvent; distance: number; radius: number } => item !== null)
        .filter(({ distance, radius }: { distance: number; radius: number }) => distance <= Math.max(44, radius * 0.72))
        .sort((a: { distance: number; event: FunctionEvent }, b: { distance: number; event: FunctionEvent }) => a.distance - b.distance || b.event.fire - a.event.fire);

      if (scored.length === 0) {
        setSelectedZone(null);
        return;
      }

      const zoneEvents = scored
        .slice(0, 7)
        .map(({ event }: { event: FunctionEvent }) => event)
        .sort((a: FunctionEvent, b: FunctionEvent) => b.fire - a.fire);

      setSelectedZone({
        anchor: [latlng.lat, latlng.lng],
        events: zoneEvents,
        totalFire: zoneEvents.reduce((sum: number, event: FunctionEvent) => sum + event.fire, 0),
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
    let fallbackTimer: number | null = null;

    loadMapbox()
      .then((mapboxgl) => {
        if (cancelled || !mapContainerRef.current) return;

        const token = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim();
        mapboxgl.accessToken = token;

        const useMapboxStyle = token.startsWith("pk.");
        let loaded = false;
        let staticFallbackStarted = false;

        const startStaticMap = () => {
          if (cancelled || staticFallbackStarted) return;
          staticFallbackStarted = true;

          if (fallbackTimer) {
            window.clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }

          if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
          }

          const rect = mapContainerRef.current?.getBoundingClientRect();
          const url = rect ? buildStaticMapUrl(token, rect.width, rect.height) : null;

          setStaticMapUrl(url);
          setStaticMapActive(true);
          setMapReady(true);
          setTilesReady(Boolean(url));
          setTileError(!url);
          setMapError(url ? null : "Map could not load. The event data is still available below.");
          setTimeout(requestDraw, 50);
        };

        try {
          const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: useMapboxStyle
              ? MAPBOX_DARK_STYLE
              : {
                  version: 8,
                  sources: {
                    "carto-dark": {
                      type: "raster",
                      tiles: [
                        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
                        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
                        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
                      ],
                      tileSize: 256,
                      attribution: "&copy; CartoDB",
                    },
                  },
                  layers: [
                    {
                      id: "carto-dark-layer",
                      type: "raster",
                      source: "carto-dark",
                      minzoom: 0,
                      maxzoom: 19,
                    },
                  ],
                },
            center: [CENTER[1], CENTER[0]], // Mapbox uses [lng, lat]
            zoom: ZOOM,
            minZoom: 12,
            maxZoom: 17,
            attributionControl: false,
            failIfMajorPerformanceCaveat: false,
          });

          mapRef.current = map;

          map.on("load", () => {
            loaded = true;
            setTilesReady(true);
            setMapReady(true);
            requestDraw();
          });

          map.on("idle", () => {
            loaded = true;
            setTilesReady(true);
            requestDraw();
          });

          map.on("error", () => {
            if (useMapboxStyle) {
              startStaticMap();
              return;
            }

            setTileError(true);
            setTilesReady(true);
            requestDraw();
          });

          map.on("move", requestDraw);
          map.on("zoom", requestDraw);
          map.on("resize", requestDraw);

          map.on("click", (e: { lngLat: { lat: number; lng: number }; point: { x: number; y: number } }) => {
            selectEventsNearPoint(e.point, { lat: e.lngLat.lat, lng: e.lngLat.lng });
          });

          fallbackTimer = window.setTimeout(() => {
            if (!loaded && useMapboxStyle) startStaticMap();
          }, 3500);
        } catch {
          startStaticMap();
        }
      })
      .catch(() => {
        const token = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim();
        const rect = mapContainerRef.current?.getBoundingClientRect();
        const url = rect ? buildStaticMapUrl(token, rect.width, rect.height) : null;

        setStaticMapUrl(url);
        setStaticMapActive(Boolean(url));
        setMapReady(Boolean(url));
        setTilesReady(Boolean(url));
        setTileError(!url);
        setMapError(url ? null : "Map could not load. The event data is still available below.");
        setTimeout(requestDraw, 50);
      });

    return () => {
      cancelled = true;
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
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
    if (!staticMapActive) return;

    const refreshStaticMap = () => {
      const token = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim();
      const rect = mapContainerRef.current?.getBoundingClientRect();
      const url = rect ? buildStaticMapUrl(token, rect.width, rect.height) : null;

      setStaticMapUrl(url);
      setTilesReady(Boolean(url));
      requestDraw();
    };

    window.addEventListener("resize", refreshStaticMap);
    return () => window.removeEventListener("resize", refreshStaticMap);
  }, [requestDraw, staticMapActive]);

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

      {staticMapActive && (
        <div
          className="absolute inset-0 z-[1] overflow-hidden"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            selectEventsNearPoint(
              { x: event.clientX - rect.left, y: event.clientY - rect.top },
              { lat: CENTER[0], lng: CENTER[1] }
            );
          }}
          style={{
            background:
              "linear-gradient(135deg, #070609 0%, #100b11 45%, #0b1019 100%)",
          }}
        >
          {staticMapUrl && (
            <img
              src={staticMapUrl}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
              onLoad={() => {
                setTilesReady(true);
                setTileError(false);
                requestDraw();
              }}
              onError={() => {
                setTilesReady(true);
                setTileError(true);
                requestDraw();
              }}
            />
          )}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 h-full w-full pointer-events-none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />

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
        className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-4"
        style={{
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          transform: panelOpen ? "translateY(0)" : "translateY(calc(100% - 4.5rem))",
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(26,17,24,0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Collapsed summary bar — always visible, tappable */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="w-full px-4 py-3 text-left active:scale-[0.99] transition-transform"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <p className="font-display text-lg tracking-wide leading-none truncate">
                  {selectedZone
                    ? `${selectedZone.events.length} MOVES FOUND`
                    : loadingUserEvents
                      ? "LOADING..."
                      : "TONIGHT'S TOP GLOWS"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "var(--accent-soft)", color: "var(--text)" }}>
                  🔥 {selectedZone ? selectedZone.totalFire : hottestEvents.reduce((sum, event) => sum + event.fire, 0)}
                </span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: "transform 0.3s ease", transform: panelOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </div>
            </div>
          </button>

          {/* Expanded event list */}
          <div className="px-4 pb-4 space-y-2" style={{ maxHeight: "45vh", overflowY: "auto", scrollbarWidth: "none" }}>
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event) => {
                const vibe = VIBE_CONFIG[event.vibe];
                const source = SOURCE_CONFIG[event.source];
                const category = SOURCE_CATEGORY_CONFIG[source.category];
                return (
                  <button
                    key={event.id}
                    onClick={() => {
                      const map = mapRef.current;
                      if (map) {
                        map.flyTo({
                          center: [event.lng, event.lat],
                          zoom: Math.max(map.getZoom(), 15),
                          duration: 450,
                        });
                      }
                      setSelectedZone({
                        anchor: [event.lat, event.lng],
                        events: [event],
                        totalFire: event.fire,
                      });
                      setPanelOpen(false);
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
                        className="inline-flex items-center"
                      >
                        <SourceLogo source={event.source} />
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

            {selectedZone && (
              <button
                onClick={() => { setSelectedZone(null); setPanelOpen(false); }}
                className="w-full rounded-xl py-2.5 text-xs font-bold tracking-wider transition-transform active:scale-[0.98]"
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
    </div>
  );
}
