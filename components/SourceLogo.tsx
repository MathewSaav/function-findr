import { Source, SOURCE_CONFIG } from "@/lib/events";

type SourceLogoProps = {
  source: Source;
  size?: "sm" | "md";
  showWordmark?: boolean;
  tone?: "badge" | "plain";
  className?: string;
};

const SOURCE_LOGOS: Record<
  Source,
  {
    mark: string;
    wordmark: string;
    markBg: string;
    markColor: string;
    wordmarkColor: string;
    surface: string;
    border: string;
  }
> = {
  eventbrite: {
    mark: "e",
    wordmark: "eventbrite",
    markBg: "#ff5a1f",
    markColor: "#fff",
    wordmarkColor: "#ff7a1a",
    surface: "rgba(255,90,31,0.12)",
    border: "rgba(255,90,31,0.35)",
  },
  dice: {
    mark: "D",
    wordmark: "DICE",
    markBg: "#050505",
    markColor: "#fff",
    wordmarkColor: "#f4f4f5",
    surface: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.22)",
  },
  partiful: {
    mark: "p",
    wordmark: "partiful",
    markBg: "#ff3b5f",
    markColor: "#fff",
    wordmarkColor: "#ff7a90",
    surface: "rgba(255,59,95,0.12)",
    border: "rgba(255,59,95,0.35)",
  },
  plotz: {
    mark: "P",
    wordmark: "Plotz",
    markBg: "#a855f7",
    markColor: "#fff",
    wordmarkColor: "#c084fc",
    surface: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.35)",
  },
  user: {
    mark: "U",
    wordmark: "Community",
    markBg: "#0ea5e9",
    markColor: "#fff",
    wordmarkColor: "#38bdf8",
    surface: "rgba(14,165,233,0.12)",
    border: "rgba(14,165,233,0.35)",
  },
  campus: {
    mark: "C",
    wordmark: "Campus",
    markBg: "#34d399",
    markColor: "#06110b",
    wordmarkColor: "#6ee7b7",
    surface: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.35)",
  },
  promoter: {
    mark: "P",
    wordmark: "Promoter",
    markBg: "#fb3b64",
    markColor: "#fff",
    wordmarkColor: "#fb7185",
    surface: "rgba(251,59,100,0.12)",
    border: "rgba(251,59,100,0.35)",
  },
  curated: {
    mark: "F",
    wordmark: "Findr",
    markBg: "#fbbf24",
    markColor: "#160d03",
    wordmarkColor: "#fbbf24",
    surface: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.35)",
  },
};

function isWideMark(source: Source, showWordmark: boolean) {
  return source === "dice" && showWordmark;
}

export default function SourceLogo({
  source,
  size = "sm",
  showWordmark = true,
  tone = "badge",
  className = "",
}: SourceLogoProps) {
  const logo = SOURCE_LOGOS[source];
  const label = SOURCE_CONFIG[source].label;
  const wideMark = isWideMark(source, showWordmark);
  const markSize = size === "md" ? 22 : 16;
  const markWidth = wideMark ? (size === "md" ? 48 : 38) : markSize;
  const padding = size === "md" ? "4px 9px 4px 4px" : "3px 7px 3px 3px";
  const fontSize = size === "md" ? 12 : 10;
  const markText = wideMark ? logo.wordmark : logo.mark;
  const shouldShowWordmark = showWordmark && !wideMark;

  return (
    <span
      aria-label={`${label} source`}
      className={`inline-flex shrink-0 items-center gap-1.5 align-middle ${className}`}
      style={{
        background: tone === "badge" ? logo.surface : "transparent",
        border: tone === "badge" ? `1px solid ${logo.border}` : "0",
        borderRadius: 8,
        color: logo.wordmarkColor,
        minHeight: size === "md" ? 30 : 22,
        padding: tone === "badge" ? padding : 0,
      }}
    >
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center font-black leading-none"
        style={{
          width: markWidth,
          height: markSize,
          borderRadius: 6,
          background: logo.markBg,
          color: logo.markColor,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: wideMark ? (size === "md" ? 12 : 10) : size === "md" ? 14 : 11,
          fontWeight: 900,
          letterSpacing: 0,
        }}
      >
        {markText}
      </span>
      {shouldShowWordmark && (
        <span
          className="truncate font-black leading-none"
          style={{
            color: logo.wordmarkColor,
            fontSize,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 0,
          }}
        >
          {logo.wordmark}
        </span>
      )}
    </span>
  );
}
