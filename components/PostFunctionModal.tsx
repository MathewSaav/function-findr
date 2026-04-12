"use client";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { FunctionEvent, Vibe, VIBE_CONFIG } from "@/lib/events";

const VIBES: Vibe[] = ["rave", "darty", "kickback", "club", "house", "bar"];

type FieldName = "name" | "vibe" | "area" | "time";
type FieldErrors = Partial<Record<FieldName, string>>;

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function validate(values: {
  name: string;
  vibe: Vibe | null;
  area: string;
  time: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const name = clean(values.name);
  const area = clean(values.area);
  const time = clean(values.time);

  if (!name) {
    errors.name = "Add a function name.";
  } else if (name.length < 3) {
    errors.name = "Use at least 3 characters.";
  } else if (!/[a-z0-9]/i.test(name)) {
    errors.name = "Use letters or numbers.";
  }

  if (!values.vibe) {
    errors.vibe = "Pick the closest vibe.";
  }

  if (!area) {
    errors.area = "Add a general area.";
  } else if (area.length < 2) {
    errors.area = "Use a recognizable area.";
  } else if (!/[a-z0-9]/i.test(area)) {
    errors.area = "Use letters or numbers.";
  }

  if (!time) {
    errors.time = "Add a time window.";
  } else if (time.length < 3) {
    errors.time = "Use a clearer time window.";
  } else if (!/[a-z0-9]/i.test(time)) {
    errors.time = "Use a readable time window.";
  }

  return errors;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverFieldErrors, setServerFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

  const validationErrors = useMemo(
    () => validate({ name, vibe, area, time }),
    [name, vibe, area, time]
  );
  const errors = { ...validationErrors, ...serverFieldErrors };
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const hasServerFieldErrors = Object.keys(serverFieldErrors).length > 0;
  const canSubmit = !hasValidationErrors && !hasServerFieldErrors && !submitting && !success;

  if (!isOpen) return null;

  function showError(field: FieldName) {
    return (touched[field] || submitAttempted) && errors[field];
  }

  function markTouched(field: FieldName) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function resetForm() {
    setName("");
    setVibe(null);
    setArea("");
    setTime("");
    setTouched({});
    setSubmitAttempted(false);
    setServerError("");
    setServerFieldErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setServerError("");
    setServerFieldErrors({});

    if (hasValidationErrors) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clean(name),
          vibe,
          area: clean(area),
          time: clean(time),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok || !data.event) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : "Could not post that function. Try again.";
        if (data?.fields && typeof data.fields === "object") {
          setServerFieldErrors(data.fields);
        }
        setServerError(message);
        return;
      }

      onSubmit(data.event);
      window.dispatchEvent(
        new CustomEvent<FunctionEvent>("function-findr:event-created", {
          detail: data.event,
        })
      );
      resetForm();
      setSuccess(true);
      await sleep(650);
      setSuccess(false);
      onClose();
    } catch {
      setServerError("Network hiccup. Check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    background: "rgba(34, 24, 32, 0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "var(--text)",
  };

  const errorStyle = {
    color: "#fb7185",
  };

  return (
    <>
      <button
        aria-label="Close post function modal"
        className="fixed inset-0 z-[60] fade-in"
        style={{
          background: "rgba(12, 10, 14, 0.82)",
          backdropFilter: "blur(10px)",
        }}
        onClick={() => {
          if (!submitting) onClose();
        }}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-[70] slide-up px-5 pb-8 pt-4"
        style={{
          background:
            "linear-gradient(180deg, rgba(34,24,32,0.98) 0%, rgba(18,12,17,0.98) 100%)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "1.5rem 1.5rem 0 0",
          boxShadow: "0 -24px 80px rgba(0,0,0,0.55)",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div className="flex justify-center mb-5">
          <div className="h-1 w-11 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: "var(--accent)" }}
            >
              USER SUBMITTED
            </p>
            <h2
              className="mt-1 text-3xl tracking-wide leading-none"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              POST A FUNCTION
            </h2>
            <p className="mt-2 max-w-[18rem] text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>
              Add the move with a general area. No exact address needed for the demo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!submitting) onClose();
            }}
            className="rounded-full px-3 py-2 text-sm font-bold transition-colors"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "var(--text-dim)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            CLOSE
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="function-name"
                className="text-[10px] font-bold tracking-[0.16em] uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Function Name
              </label>
              <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                REQUIRED
              </span>
            </div>
            <input
              id="function-name"
              type="text"
              placeholder="AFTER DARK, ROOFTOP PRE, HOUSE ROW..."
              value={name}
              maxLength={56}
              onBlur={() => markTouched("name")}
              onChange={(event) => {
                setName(event.target.value);
                setServerError("");
                setServerFieldErrors({});
              }}
              className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--accent)]"
              style={inputStyle}
            />
            {showError("name") && (
              <p className="text-xs font-semibold" style={errorStyle}>
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold tracking-[0.16em] uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Vibe
              </p>
              <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                REQUIRED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {VIBES.map((option) => {
                const cfg = VIBE_CONFIG[option];
                const selected = vibe === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setVibe(option);
                      markTouched("vibe");
                      setServerError("");
                      setServerFieldErrors({});
                    }}
                    className="rounded-xl px-3 py-3 text-left text-[11px] font-bold tracking-wider transition-all active:scale-[0.98]"
                    style={
                      selected
                        ? {
                            background: cfg.color,
                            color: "#fff",
                            boxShadow: `0 0 22px ${cfg.color}55`,
                          }
                        : {
                            background: "rgba(12,10,14,0.34)",
                            color: "var(--text-dim)",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }
                    }
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            {showError("vibe") && (
              <p className="text-xs font-semibold" style={errorStyle}>
                {errors.vibe}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="function-area"
                  className="text-[10px] font-bold tracking-[0.16em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  General Area
                </label>
                <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  REQUIRED
                </span>
              </div>
              <input
                id="function-area"
                type="text"
                placeholder="SoFA District, Near Campus, Japantown..."
                value={area}
                maxLength={48}
                onBlur={() => markTouched("area")}
                onChange={(event) => {
                  setArea(event.target.value);
                  setServerError("");
                  setServerFieldErrors({});
                }}
                className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                style={inputStyle}
              />
              {showError("area") && (
                <p className="text-xs font-semibold" style={errorStyle}>
                  {errors.area}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="function-time"
                  className="text-[10px] font-bold tracking-[0.16em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  Time Window
                </label>
                <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  REQUIRED
                </span>
              </div>
              <input
                id="function-time"
                type="text"
                placeholder="10:00 PM - 2:00 AM"
                value={time}
                maxLength={48}
                onBlur={() => markTouched("time")}
                onChange={(event) => {
                  setTime(event.target.value);
                  setServerError("");
                  setServerFieldErrors({});
                }}
                className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                style={inputStyle}
              />
              {showError("time") && (
                <p className="text-xs font-semibold" style={errorStyle}>
                  {errors.time}
                </p>
              )}
            </div>
          </div>

          {serverError && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-semibold"
              style={{
                background: "rgba(251, 113, 133, 0.12)",
                border: "1px solid rgba(251, 113, 133, 0.32)",
                color: "#fecdd3",
              }}
            >
              {serverError}
            </div>
          )}

          {success && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-semibold"
              style={{
                background: "rgba(52, 211, 153, 0.12)",
                border: "1px solid rgba(52, 211, 153, 0.32)",
                color: "#bbf7d0",
              }}
            >
              Posted. It is live in the feed and map.
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="glow-accent w-full rounded-2xl py-4 text-lg font-bold tracking-wider transition-all active:scale-[0.98] disabled:scale-100 disabled:opacity-35"
            style={{
              background: "var(--accent)",
              color: "#fff",
              fontFamily: "'Bebas Neue', sans-serif",
            }}
          >
            {success ? "POSTED" : submitting ? "POSTING..." : "DROP THE FUNCTION"}
          </button>
        </form>
      </div>
    </>
  );
}
