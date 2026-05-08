import { Activity, Skull, Globe2, FileText } from "lucide-react";
import type { CasesResponse } from "@/lib/api/types";

interface StatProps {
  label: string;
  value: number | string;
  sub: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "amber" | "rose" | "muted" | "yellow";
}

const TONE: Record<StatProps["tone"], { value: string; icon: string; ring: string }> = {
  amber: { value: "text-amber-300", icon: "text-amber-300/70", ring: "shadow-[inset_0_1px_0_oklch(0.74_0.16_65/0.25)]" },
  rose: { value: "text-rose-400", icon: "text-rose-400/70", ring: "shadow-[inset_0_1px_0_oklch(0.64_0.22_25/0.30)]" },
  yellow: { value: "text-yellow-300", icon: "text-yellow-300/70", ring: "shadow-[inset_0_1px_0_oklch(0.83_0.17_95/0.25)]" },
  muted: { value: "text-foreground", icon: "text-muted-foreground", ring: "" },
};

function Stat({ label, value, sub, Icon, tone }: StatProps) {
  const t = TONE[tone];
  return (
    <div
      className={`relative rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm ${t.ring}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${t.icon}`} />
      </div>
      <div className={`mt-4 font-display tabular text-5xl leading-none ${t.value}`}>{value}</div>
      <div className="mt-2 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

export default function Counters({ totals }: { totals: CasesResponse["totals"] }) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  const cfr =
    totals.cases_confirmed > 0 && totals.deaths <= totals.cases_confirmed
      ? `${((100 * totals.deaths) / totals.cases_confirmed).toFixed(0)}% case-fatality`
      : totals.deaths > 0
        ? "incl. presumed"
        : "—";
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <Stat label="Confirmed" value={fmt(totals.cases_confirmed)} sub="laboratory-confirmed" Icon={Activity} tone="amber" />
      <Stat label="Deaths" value={fmt(totals.deaths)} sub={cfr} Icon={Skull} tone="rose" />
      <Stat label="Suspected" value={fmt(totals.cases_suspected)} sub="not yet confirmed" Icon={FileText} tone="yellow" />
      <Stat label="Countries" value={fmt(totals.countries)} sub={`${fmt(totals.events)} events`} Icon={Globe2} tone="muted" />
    </section>
  );
}
