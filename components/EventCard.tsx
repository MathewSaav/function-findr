"use client";
import { useState } from "react";
import {
  FunctionEvent,
  SOURCE_CATEGORY_CONFIG,
  SOURCE_CONFIG,
  VIBE_CONFIG,
} from "@/lib/events";

export default function EventCard({
  event,
  onFire,
  index = 0,
}: {
  event: FunctionEvent;
  onFire: () => void;
  index?: number;
}) {
  const vibe = VIBE_CONFIG[event.vibe];
  const source = SOURCE_CONFIG[event.source];
  const category = SOURCE_CATEGORY_CONFIG[source.category];
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        animation: `card-enter 0.4s ease-out ${index * 0.08}s both`,
      }}
    >
      {/* Hero image area */}
      <div
        className="relative h-44 flex items-end"
        style={{ background: event.gradient }}
      >
        {/* Source badge */}
        <span
          className="absolute top-3 left-3 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: source.bg, color: source.color }}
        >
          {source.detailLabel}
        </span>

        {/* Fire counter */}
        <button
          onClick={onFire}
          className="fire-pulse absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{
            background: "rgba(12, 10, 14, 0.7)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--text)",
          }}
        >
          🔥 <span style={{ fontVariantNumeric: "tabular-nums" }}>{event.fire}</span>
        </button>

        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-20"
          style={{
            background:
              "linear-gradient(to top, var(--bg-card), transparent)",
          }}
        />
      </div>

      {/* Info area */}
      <div className="px-4 pb-4 pt-1 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <h3
            className="font-display text-xl leading-tight tracking-wide"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {event.name}
          </h3>
          <span
            className="shrink-0 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full mt-0.5"
            style={{
              color: vibe.color,
              background: vibe.color + "20",
              border: `1px solid ${vibe.color}40`,
            }}
          >
            {vibe.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-dim)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" stroke="none">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" fill="var(--bg-card)" />
          </svg>
          {event.area}
        </div>

        <div
          className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
          style={{
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="min-w-0">
            <p
              className="truncate text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: "var(--text-muted)" }}
            >
              SOURCE
            </p>
            <p className="truncate text-xs font-semibold" style={{ color: "var(--text-dim)" }}>
              {source.cue} · {source.detailLabel}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold tracking-wider"
            style={{ background: category.bg, color: category.color }}
          >
            {category.label}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              TIME WINDOW
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {event.time}
            </p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-bold tracking-wider px-4 py-2 rounded-full transition-all active:scale-95"
            style={
              expanded
                ? {
                    background: "var(--accent)",
                    color: "#fff",
                    border: "1.5px solid var(--accent)",
                  }
                : {
                    border: "1.5px solid var(--accent)",
                    color: "var(--accent)",
                    background: "transparent",
                  }
            }
          >
            {expanded ? "CLOSE" : event.fire > 120 ? "JOIN PULSE" : "DETAILS"}
          </button>
        </div>

        {/* Expanded section */}
        {expanded && (
          <div
            className="pt-2 mt-1 space-y-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                style={{ background: "var(--bg-card-elevated)" }}
              >
                <span className="text-lg">🔥</span>
                <span
                  className="text-xl font-bold"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    color: "var(--accent)",
                  }}
                >
                  {event.fire}
                </span>
              </div>
              <div>
                <p
                  className="text-[10px] font-bold tracking-[0.15em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  PULSE CHECK
                </p>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {event.fire} people are feeling this
                </p>
              </div>
            </div>

            {event.description && (
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>
                {event.description}
              </p>
            )}

            {(event.crowd || event.dress || event.host) && (
              <div className="grid grid-cols-2 gap-2">
                {event.crowd && (
                  <div
                    className="rounded-xl px-3 py-2"
                    style={{ background: "var(--bg-card-elevated)" }}
                  >
                    <p
                      className="text-[9px] font-bold tracking-[0.16em] uppercase"
                      style={{ color: "var(--text-muted)" }}
                    >
                      CROWD
                    </p>
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                      {event.crowd}
                    </p>
                  </div>
                )}
                {event.dress && (
                  <div
                    className="rounded-xl px-3 py-2"
                    style={{ background: "var(--bg-card-elevated)" }}
                  >
                    <p
                      className="text-[9px] font-bold tracking-[0.16em] uppercase"
                      style={{ color: "var(--text-muted)" }}
                    >
                      VIBE LINE
                    </p>
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                      {event.dress}
                    </p>
                  </div>
                )}
                {event.host && (
                  <div
                    className="col-span-2 rounded-xl px-3 py-2"
                    style={{ background: "var(--bg-card-elevated)" }}
                  >
                    <p
                      className="text-[9px] font-bold tracking-[0.16em] uppercase"
                      style={{ color: "var(--text-muted)" }}
                    >
                      HOST NOTE
                    </p>
                    <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                      {event.host}
                    </p>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs" style={{ color: "var(--text-dim)" }}>
              Source layer:{" "}
              <span className="font-bold" style={{ color: source.bg }}>
                {source.detailLabel}
              </span>
              {" · "}
              {category.description}
              {" · "}Tap 🔥 to add your energy
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
