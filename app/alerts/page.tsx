"use client";

export default function AlertsPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(220, 39, 67, 0.1) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 space-y-5">
        {/* Bell icon */}
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              animation: "icon-pulse 2s ease-in-out infinite",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1
          className="text-3xl tracking-wide"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          ALERTS DROPPING SOON
        </h1>

        {/* Subtext */}
        <p className="text-base" style={{ color: "var(--text-dim)" }}>
          Get notified when your crew
          <br />
          hits a function.
        </p>

        {/* Teaser pills */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {["NEARBY EVENTS", "CREW ACTIVITY", "VIBE ALERTS"].map((label) => (
            <span
              key={label}
              className="text-[10px] font-bold tracking-[0.15em] px-3 py-1.5 rounded-full"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
