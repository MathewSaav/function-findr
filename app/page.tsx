"use client";
import { useState, useEffect } from "react";
import { SEED_EVENTS, FunctionEvent, Vibe, VIBE_CONFIG } from "@/lib/events";
import EventCard from "@/components/EventCard";
import PostFunctionModal from "@/components/PostFunctionModal";

const FILTERS: (Vibe | "all")[] = ["all", "rave", "darty", "kickback", "club", "house", "bar"];

export default function FeedPage() {
  const [events, setEvents] = useState<FunctionEvent[]>(SEED_EVENTS);
  const [filter, setFilter] = useState<Vibe | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch user-submitted events on mount
  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => {
        if (d.events && d.events.length > 0) {
          setEvents((prev) => {
            const ids = new Set(prev.map((e) => e.id));
            const newEvents = d.events.filter((e: FunctionEvent) => !ids.has(e.id));
            return [...newEvents, ...prev];
          });
        }
      })
      .catch(() => {});
  }, []);

  const filtered = filter === "all" ? events : events.filter((e) => e.vibe === filter);
  const sorted = [...filtered].sort((a, b) => b.fire - a.fire);

  function handleFire(id: string) {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, fire: e.fire + 1 } : e))
    );
  }

  function handleNewEvent(event: FunctionEvent) {
    setEvents((prev) => [event, ...prev]);
  }

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--accent)", fontSize: "20px" }}>⚡</span>
          <span
            className="text-xl tracking-wider font-bold"
            style={{ fontFamily: "'Bebas Neue', sans-serif", color: "var(--accent)" }}
          >
            FINDR
          </span>
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: "var(--bg-card-elevated)", border: "1px solid var(--border)" }}
        >
          👤
        </div>
      </div>

      {/* Section title */}
      <div>
        <p
          className="text-[11px] font-bold tracking-[0.2em] uppercase"
          style={{ color: "var(--accent)" }}
        >
          LIVE ENERGY
        </p>
        <h1
          className="text-3xl tracking-wide leading-none mt-1"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          TONIGHT IN THE CITY
        </h1>
      </div>

      {/* Filter chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4"
        style={{ scrollbarWidth: "none" }}
      >
        {FILTERS.map((v) => {
          const active = filter === v;
          const cfg = v === "all" ? null : VIBE_CONFIG[v];
          return (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className="shrink-0 text-[11px] font-bold tracking-wider px-3.5 py-1.5 rounded-full transition-all"
              style={
                active
                  ? { background: "var(--accent)", color: "#fff" }
                  : {
                      background: "var(--bg-card)",
                      color: "var(--text-dim)",
                      border: "1px solid var(--border)",
                    }
              }
            >
              {v === "all" ? "ALL" : cfg!.label}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="space-y-4 pb-4">
        {sorted.map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            onFire={() => handleFire(event.id)}
            index={index}
          />
        ))}
      </div>

      {/* FAB - post a function */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg z-40 active:scale-90 transition-transform glow-accent"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        +
      </button>

      {/* Post modal */}
      <PostFunctionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleNewEvent}
      />
    </div>
  );
}
