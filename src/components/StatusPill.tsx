interface StatusPillProps {
  lastUpdated: string | null;
}

function howLongAgo(iso: string | null): string {
  if (!iso) return "no data";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "no data";
  const ms = Date.now() - t;
  if (ms < 60_000) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function StatusPill({ lastUpdated }: StatusPillProps) {
  const text = howLongAgo(lastUpdated);
  // Color by freshness: green <= 6h, amber <= 36h, red beyond
  const fresh = lastUpdated
    ? Date.now() - new Date(lastUpdated).getTime()
    : Number.POSITIVE_INFINITY;
  const tone =
    fresh < 6 * 3600_000
      ? "text-emerald-400"
      : fresh < 36 * 3600_000
        ? "text-amber-400"
        : "text-rose-400";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs uppercase tracking-wider">
      <span className={`relative inline-block h-2 w-2 rounded-full ${tone} pulse-dot`}>
        <span className="absolute inset-0 rounded-full bg-current" />
      </span>
      <span className="font-medium text-muted-foreground">Live</span>
      <span className="text-muted-foreground/60">·</span>
      <span className="tabular text-foreground/80">updated {text}</span>
    </div>
  );
}
