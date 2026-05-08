import { ExternalLink } from "lucide-react";
import { countryName, flag } from "@/lib/countries";
import type { HistoricalEvent } from "@/lib/api/types";

const STRAIN_LABEL: Record<string, string> = {
  sin_nombre: "Sin Nombre",
  andes: "Andes",
  seoul: "Seoul",
  puumala: "Puumala",
  dobrava: "Dobrava",
  hantaan: "Hantaan",
};

function strainLabel(s: string | null): string {
  if (!s) return "Hantaan family";
  return STRAIN_LABEL[s] ?? s;
}

export default function HistoricalTimeline({ items }: { items: HistoricalEvent[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border/60 bg-card/30 p-5 backdrop-blur-sm">
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-2xl">Notable past outbreaks</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Curated benchmarks for context — not part of the live feed.
          </p>
        </div>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {items.length} events
        </span>
      </header>

      <ol className="relative mt-6 space-y-6 border-l border-border/60 pl-6">
        {items.map((ev, i) => {
          const year = ev.report_date.slice(0, 4);
          const isPlatformChanging = i === 0 || i === items.length - 1; // emphasize first / latest
          return (
            <li key={`${ev.report_date}-${ev.country_iso2}-${i}`} className="relative">
              <span
                className={`absolute -left-[33px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                  isPlatformChanging
                    ? "border-rose-400 bg-rose-500/30"
                    : "border-amber-400/60 bg-amber-500/20"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              </span>

              <div className="grid gap-1 md:grid-cols-[5rem_1fr]">
                <span className="font-display tabular text-2xl text-muted-foreground">
                  {year}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-base font-medium text-foreground">
                      {flag(ev.country_iso2)} {ev.locality ?? ev.region ?? countryName(ev.country_iso2)}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {countryName(ev.country_iso2)}
                    </span>
                    <span className="rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-amber-300/80">
                      {strainLabel(ev.virus_strain)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <span>
                      <span className="tabular text-amber-300">{ev.cases_confirmed.toLocaleString("en-US")}</span>{" "}
                      <span className="text-muted-foreground">confirmed</span>
                    </span>
                    {ev.deaths > 0 && (
                      <span>
                        <span className="tabular text-rose-400">{ev.deaths.toLocaleString("en-US")}</span>{" "}
                        <span className="text-muted-foreground">deaths</span>
                      </span>
                    )}
                    {ev.cases_confirmed > 0 && ev.deaths > 0 && (
                      <span className="text-xs text-muted-foreground self-center">
                        {Math.round((100 * ev.deaths) / ev.cases_confirmed)}% CFR
                      </span>
                    )}
                  </div>

                  {ev.notes && (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {ev.notes}
                    </p>
                  )}

                  {ev.sources?.url && (
                    <a
                      href={ev.sources.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="underline-offset-4 group-hover:underline">{ev.sources.title || "source"}</span>
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
