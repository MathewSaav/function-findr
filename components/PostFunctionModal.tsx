"use client";
import { useState } from "react";
import { FunctionEvent, Vibe, VIBE_CONFIG } from "@/lib/events";

const VIBES: Vibe[] = ["rave", "darty", "kickback", "club", "house", "bar"];

export default function PostFunctionModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: FunctionEvent) => void;
}) {
  const [name, setName] = useState("");
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [area, setArea] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const canSubmit = name.trim() && vibe && area.trim() && time.trim() && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          vibe,
          area: area.trim(),
          time: time.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onSubmit(data.event);
        setName("");
        setVibe(null);
        setArea("");
        setTime("");
        onClose();
      }
    } catch {
      alert("Something went wrong — try again!");
    }
    setLoading(false);
  }

  const inputStyle = {
    background: "var(--bg-card-elevated)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] fade-in"
        style={{
          background: "rgba(12, 10, 14, 0.8)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] slide-up px-5 pb-8 pt-4"
        style={{
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border)",
          borderRadius: "1.5rem 1.5rem 0 0",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-5">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "var(--border)" }}
          />
        </div>

        {/* Title */}
        <h2
          className="text-2xl tracking-wide mb-5"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            color: "var(--accent)",
          }}
        >
          POST A FUNCTION
        </h2>

        <div className="space-y-4">
          {/* Party Name */}
          <div className="space-y-1.5">
            <label
              className="text-[10px] font-bold tracking-[0.15em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              PARTY NAME
            </label>
            <input
              type="text"
              placeholder="WHAT'S THE MOVE?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* Vibe Selector */}
          <div className="space-y-1.5">
            <label
              className="text-[10px] font-bold tracking-[0.15em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              VIBE
            </label>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => {
                const cfg = VIBE_CONFIG[v];
                const selected = vibe === v;
                return (
                  <button
                    key={v}
                    onClick={() => setVibe(v)}
                    className="text-[11px] font-bold tracking-wider px-3.5 py-1.5 rounded-full transition-all"
                    style={
                      selected
                        ? { background: cfg.color, color: "#fff" }
                        : {
                            background: "transparent",
                            color: "var(--text-dim)",
                            border: "1px solid var(--border)",
                          }
                    }
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area */}
          <div className="space-y-1.5">
            <label
              className="text-[10px] font-bold tracking-[0.15em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              AREA
            </label>
            <input
              type="text"
              placeholder="WHERE AT?"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <label
              className="text-[10px] font-bold tracking-[0.15em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              TIME
            </label>
            <input
              type="text"
              placeholder="WHEN? (e.g. 10PM - 2AM)"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 rounded-2xl text-lg tracking-wider font-bold transition-all active:scale-[0.97] disabled:opacity-30 glow-accent mt-2"
            style={{
              background: "var(--accent)",
              color: "#fff",
              fontFamily: "'Bebas Neue', sans-serif",
            }}
          >
            {loading ? "..." : "DROP IT 🔥"}
          </button>
        </div>
      </div>
    </>
  );
}
