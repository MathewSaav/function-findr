"use client";

const STATS = [
  { label: "FUNCTIONS ATTENDED", value: "--" },
  { label: "FIRE GIVEN", value: "--" },
  { label: "CREW SIZE", value: "--" },
];

export default function ProfilePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(220, 39, 67, 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Avatar */}
        <div className="flex justify-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl"
            style={{
              background: "var(--bg-card-elevated)",
              border: "2px solid var(--border)",
            }}
          >
            👤
          </div>
        </div>

        {/* Heading */}
        <h1
          className="text-3xl tracking-wide"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          YOUR PROFILE
        </h1>

        {/* Subtext */}
        <p className="text-base" style={{ color: "var(--text-dim)" }}>
          Coming soon. For now, go find the function.
        </p>

        {/* Stats teaser */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl px-3 py-4 space-y-2"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-2xl font-bold"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  color: "var(--accent)",
                }}
              >
                {stat.value}
              </p>
              <p
                className="text-[9px] font-bold tracking-[0.15em] leading-tight"
                style={{ color: "var(--text-muted)" }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
