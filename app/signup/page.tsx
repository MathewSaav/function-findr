"use client";
import { useState, useEffect } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/signup")
      .then((r) => r.json())
      .then((d) => setCount(d.count))
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitted(true);
        setCount(data.count);
      }
    } catch {
      alert("Something went wrong — try again!");
    }
    setLoading(false);
  }

  const displayCount = count > 0 ? count.toLocaleString() : "0";

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(220, 39, 67, 0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Logo */}
        <p
          className="text-2xl tracking-[0.15em] font-bold"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            color: "var(--accent)",
          }}
        >
          FINDR
        </p>

        {!submitted ? (
          <>
            {/* Location pill */}
            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] px-4 py-2 rounded-full"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                }}
              >
                ⚡ LIVE IN YOUR CITY
              </span>
            </div>

            {/* Hero text */}
            <div>
              <h1
                className="text-5xl leading-none tracking-wide"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                THE MOVE
              </h1>
              <h1
                className="text-5xl leading-none tracking-wide italic"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  color: "var(--accent)",
                }}
              >
                IS HERE
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-base leading-relaxed" style={{ color: "var(--text-dim)" }}>
              The heartbeat of the city in your pocket.
              <br />
              No more dead clubs, no more mid vibes.
              <br />
              Just the pulse.
            </p>

            {/* Avatar stack + counter */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="flex items-center -space-x-2">
                {["🧑", "👩", "🧔", "👱"].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm border-2"
                    style={{
                      background: "var(--bg-card-elevated)",
                      borderColor: "var(--bg)",
                    }}
                  >
                    {emoji}
                  </div>
                ))}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold border-2"
                  style={{
                    background: "var(--bg-card-elevated)",
                    borderColor: "var(--bg)",
                    color: "var(--text-dim)",
                  }}
                >
                  +{displayCount}
                </div>
              </div>
              <p
                className="text-[11px] font-bold tracking-[0.2em]"
                style={{ color: "var(--text-muted)" }}
              >
                {displayCount} STUDENTS ALREADY JOINED
              </p>
            </div>

            {/* Email input */}
            <input
              type="email"
              placeholder="Enter your student email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-5 py-4 rounded-2xl text-base outline-none transition-colors"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !email.trim()}
              className="w-full py-4 rounded-2xl text-base font-bold tracking-wider transition-all active:scale-[0.97] disabled:opacity-40 glow-accent"
              style={{
                background: "var(--accent)",
                color: "#fff",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {loading ? "..." : "Join the Waitlist"}
            </button>

            <p
              className="text-[10px] font-semibold tracking-[0.2em]"
              style={{ color: "var(--text-muted)" }}
            >
              EARLY ACCESS ROLLING OUT WEEKLY.
            </p>
          </>
        ) : (
          /* ─── SUCCESS STATE ─── */
          <>
            <div className="text-6xl mb-2">🎉</div>
            <h1
              className="text-4xl tracking-wide"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              YOU&apos;RE IN
            </h1>
            <p style={{ color: "var(--text-dim)" }}>
              We&apos;ll hit you up when it drops.
              <br />
              Share with your crew to move up.
            </p>

            <div
              className="rounded-2xl px-6 py-6 space-y-1"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-[10px] font-bold tracking-[0.2em]"
                style={{ color: "var(--text-muted)" }}
              >
                YOUR SPOT
              </p>
              <p
                className="text-5xl font-bold"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  color: "var(--accent)",
                }}
              >
                #{displayCount}
              </p>
            </div>

            <p
              className="text-[11px] font-bold tracking-[0.2em]"
              style={{ color: "var(--text-muted)" }}
            >
              {displayCount} STUDENTS ON THE WAITLIST
            </p>
          </>
        )}
      </div>
    </div>
  );
}
