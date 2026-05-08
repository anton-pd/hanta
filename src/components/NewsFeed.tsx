import { ExternalLink } from "lucide-react";
import { countryName, flag } from "@/lib/countries";
import type { NewsItem } from "@/lib/api/types";

const SOURCE_TONE: Record<string, string> = {
  who: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  paho: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  cdc: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  ecdc: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  promed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  gdelt: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  google_news: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  reddit: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  bluesky: "bg-blue-500/15 text-blue-300 border-blue-500/30",
};

const SOURCE_LABEL: Record<string, string> = {
  who: "WHO", paho: "PAHO", cdc: "CDC", ecdc: "ECDC", promed: "ProMED",
  gdelt: "GDELT", google_news: "Google", reddit: "Reddit", bluesky: "Bluesky",
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function NewsFeed({ items }: { items: NewsItem[] }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/30 p-5 backdrop-blur-sm">
      <header className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl">Latest sources</h2>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {items.length} items
        </span>
      </header>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No sources ingested yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border/50">
          {items.map((it) => {
            const date = it.published_at ? new Date(it.published_at).toISOString().slice(0, 10) : "—";
            const matched = it.case_reports.length > 0;
            const tone = SOURCE_TONE[it.source_type] ?? "bg-muted/40 text-muted-foreground border-border";
            const label = SOURCE_LABEL[it.source_type] ?? it.source_type;
            return (
              <li key={it.id}>
                <a
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 py-3 transition-colors"
                >
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}
                  >
                    {label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm leading-snug text-foreground/90 group-hover:text-foreground">
                      {it.title || it.url}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="tabular">{date}</span>
                      <span>{hostname(it.url)}</span>
                      {matched && (
                        <span className="text-foreground/80">
                          {it.case_reports.map((r) => (
                            <span key={`${r.country_iso2}-${r.report_date}`} className="mr-2">
                              {flag(r.country_iso2)} {countryName(r.country_iso2)}{" "}
                              <span className="text-amber-300 tabular">{r.cases_confirmed}c</span>
                              {r.deaths > 0 && (
                                <span className="text-rose-400 tabular"> / {r.deaths}d</span>
                              )}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
