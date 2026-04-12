"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

type SignupResponse = {
  ok?: boolean;
  duplicate?: boolean;
  email?: string;
  count?: number;
  position?: number;
  error?: string;
  message?: string;
};

const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function validateEmail(value: string): string {
  const email = normalizeEmail(value);

  if (!email) return "Enter your email to join early access.";
  if (email.length > 254) return "Use a shorter email address.";
  if (email.includes("..")) return "Check the email format.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";

  const [local, domain] = email.split("@");
  if (!local || local.length > 64 || !domain || domain.startsWith(".") || domain.endsWith(".")) {
    return "Enter a valid email address.";
  }

  return "";
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [duplicate, setDuplicate] = useState(false);
  const [count, setCount] = useState(0);
  const [position, setPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const prevCount = useRef(0);

  const emailError = useMemo(() => validateEmail(email), [email]);
  const normalizedEmail = normalizeEmail(email);
  const canSubmit = !emailError && !loading && normalizedEmail !== submittedEmail;
  const displayCount = count > 0 ? count.toLocaleString() : "0";

  useEffect(() => {
    let active = true;

    function fetchCount() {
      fetch("/api/signup")
        .then((response) => response.json())
        .then((data: SignupResponse) => {
          if (!active || typeof data.count !== "number") return;
          if (data.count >= prevCount.current) {
            prevCount.current = data.count;
            setCount(data.count);
          }
        })
        .catch(() => {});
    }

    fetchCount();
    const interval = setInterval(fetchCount, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setError("");

    if (emailError || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data: SignupResponse = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setError(data.error || "Could not save your spot. Try again.");
        return;
      }

      const nextCount = typeof data.count === "number" ? data.count : count;
      const nextPosition = typeof data.position === "number" ? data.position : nextCount;

      setSubmitted(true);
      setDuplicate(Boolean(data.duplicate));
      setSubmittedEmail(data.email || normalizedEmail);
      setCount(nextCount);
      setPosition(nextPosition);
      prevCount.current = nextCount;
    } catch {
      setError("Network hiccup. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen px-5 py-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(220,39,67,0.12) 0%, rgba(12,10,14,0) 30%), var(--bg)",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-between">
        <header className="flex items-center justify-between">
          <div>
            <p
              className="text-2xl font-bold tracking-[0.16em]"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                color: "var(--accent)",
              }}
            >
              FINDR
            </p>
            <p
              className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--text-muted)" }}
            >
              Early Access
            </p>
          </div>
          <div
            className="rounded-full px-3 py-1.5 text-xs font-bold"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            {displayCount} joined
          </div>
        </header>

        <main className="py-8">
          {!submitted ? (
            <div className="space-y-7">
              <section className="space-y-4">
                <div className="inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ background: "var(--accent-soft)", color: "var(--text)" }}>
                  Campus nightlife waitlist
                </div>
                <div className="space-y-2">
                  <h1
                    className="text-5xl leading-[0.94] tracking-wide"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    FIND THE MOVE BEFORE EVERYONE TEXTS YOU
                  </h1>
                  <p className="text-base leading-relaxed" style={{ color: "var(--text-dim)" }}>
                    One feed for campus functions, promoter drops, bars, clubs, and imported-style listings.
                  </p>
                </div>
              </section>

              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Source mix", "Campus + city"],
                  ["Early list", displayCount],
                  ["Launch", "Rolling soon"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl px-3 py-3"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <p
                      className="text-[9px] font-bold uppercase tracking-[0.16em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <form
                className="space-y-3 rounded-2xl p-4"
                onSubmit={handleSubmit}
                noValidate
                style={{
                  background: "rgba(26,17,24,0.86)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="waitlist-email"
                      className="text-[10px] font-bold uppercase tracking-[0.16em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Email
                    </label>
                    <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      REQUIRED
                    </span>
                  </div>
                  <input
                    id="waitlist-email"
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="you@school.edu"
                    value={email}
                    onBlur={() => setTouched(true)}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setDuplicate(false);
                    }}
                    className="w-full rounded-xl px-4 py-4 text-base outline-none transition-colors focus:border-[var(--accent)]"
                    style={{
                      background: "var(--bg-card-elevated)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  />
                  {touched && emailError && (
                    <p className="text-xs font-semibold" style={{ color: "#fb7185" }}>
                      {emailError}
                    </p>
                  )}
                </div>

                {error && (
                  <div
                    className="rounded-xl px-4 py-3 text-sm font-semibold"
                    style={{
                      background: "rgba(251,113,133,0.12)",
                      border: "1px solid rgba(251,113,133,0.32)",
                      color: "#fecdd3",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="glow-accent w-full rounded-xl py-4 text-base font-bold tracking-wider transition-all active:scale-[0.98] disabled:scale-100 disabled:opacity-40"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                  }}
                >
                  {loading ? "Saving your spot..." : "Join Early Access"}
                </button>

                <p className="text-center text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  No spam. Just launch access and the earliest city drops.
                </p>
              </form>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: duplicate ? "var(--text-muted)" : "var(--accent)" }}
                >
                  {duplicate ? "Already Joined" : "Spot Saved"}
                </p>
                <h1
                  className="mt-2 text-5xl leading-none tracking-wide"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {duplicate ? "YOU'RE ON THE LIST" : "YOU'RE IN"}
                </h1>
                <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--text-dim)" }}>
                  {duplicate
                    ? "That email was already holding a spot. You're good."
                    : "Early access is locked. We'll use this email when the next city wave opens."}
                </p>
              </div>

              <div
                className="rounded-2xl px-5 py-6"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Your Waitlist Spot
                </p>
                <p
                  className="mt-2 text-6xl font-bold leading-none"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    color: "var(--accent)",
                  }}
                >
                  #{(position ?? count).toLocaleString()}
                </p>
                <p className="mt-3 text-sm" style={{ color: "var(--text-dim)" }}>
                  {displayCount} total people are on the early access list.
                </p>
              </div>

              <div
                className="rounded-2xl px-4 py-4 text-left"
                style={{
                  background: "rgba(26,17,24,0.72)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Signed up as
                </p>
                <p className="mt-1 truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {submittedEmail}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                  setTouched(false);
                  setError("");
                }}
                className="w-full rounded-xl py-3 text-sm font-bold tracking-wider transition-all active:scale-[0.98]"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-dim)",
                }}
              >
                Add Another Email
              </button>
            </div>
          )}
        </main>

        <footer className="pb-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
            Built for fast campus nightlife discovery.
          </p>
        </footer>
      </div>
    </div>
  );
}
