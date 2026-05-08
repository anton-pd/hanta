import StatusPill from "./StatusPill";
import { countryName, flag } from "@/lib/countries";
import type { CasesResponse, NewsItem } from "@/lib/api/types";

interface HeroProps {
  totals: CasesResponse["totals"];
  range: { from: string; to: string };
  topCountry: { country_iso2: string; cases_confirmed: number; deaths: number } | null;
  latestRelevant: NewsItem | null;
  lastUpdated: string | null;
}

export default function Hero({ totals, range, topCountry, latestRelevant, lastUpdated }: HeroProps) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  return (
    <section className="relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusPill lastUpdated={lastUpdated} />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Window {range.from} → {range.to}
        </span>
      </div>

      <h1 className="mt-6 font-display text-5xl leading-[0.95] md:text-7xl">
        Hantavirus
        <br />
        <span className="italic text-muted-foreground">surveillance</span>
      </h1>

      <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
        Confirmed human hantavirus cases extracted from{" "}
        <span className="text-foreground">WHO Disease Outbreak News</span>,{" "}
        <span className="text-foreground">GDELT</span>,{" "}
        <span className="text-foreground">PAHO</span>, and{" "}
        <span className="text-foreground">Google News</span> by an LLM pipeline.
        Updated daily.
      </p>

      {(totals.cases_confirmed > 0 || totals.deaths > 0) && (
        <p className="mt-6 text-pretty text-lg leading-relaxed text-foreground/90 md:text-xl">
          <span className="font-display italic text-muted-foreground">As of {range.to}, </span>
          <span className="tabular text-amber-300">{fmt(totals.cases_confirmed)}</span> confirmed{" "}
          <span className="text-muted-foreground">/ </span>
          <span className="tabular text-rose-400">{fmt(totals.deaths)}</span> dead{" "}
          <span className="text-muted-foreground">across </span>
          <span className="tabular text-foreground">{totals.countries}</span>{" "}
          {totals.countries === 1 ? "country" : "countries"}
          {topCountry && (
            <>
              {" "}
              <span className="text-muted-foreground">— largest cluster in </span>
              <span className="text-foreground">
                {flag(topCountry.country_iso2)} {countryName(topCountry.country_iso2)}
              </span>
            </>
          )}
          .
        </p>
      )}

      {latestRelevant && (
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Latest event:{" "}
          <a
            href={latestRelevant.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline-offset-4 hover:underline"
          >
            {latestRelevant.title}
          </a>
        </p>
      )}

      <p className="mt-8 max-w-2xl text-xs text-muted-foreground">
        ⚠ Not an official surveillance source. Built for public situational awareness only.
        See <a className="underline underline-offset-2" href="/about">methodology</a>.
      </p>
    </section>
  );
}
