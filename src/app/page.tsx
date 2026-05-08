import { headers } from "next/headers";
import Hero from "@/components/Hero";
import Counters from "@/components/Counters";
import CountryTable from "@/components/CountryTable";
import NewsFeed from "@/components/NewsFeed";
import HantaMap from "@/components/Map";
import type { CasesResponse, NewsItem, NewsResponse } from "@/lib/api/types";

export const revalidate = 120;

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function loadCases(): Promise<CasesResponse> {
  const o = await origin();
  const res = await fetch(`${o}/api/cases`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`/api/cases ${res.status}`);
  return res.json();
}

async function loadNews(): Promise<NewsResponse> {
  const o = await origin();
  const res = await fetch(`${o}/api/news?page=0`, { next: { revalidate: 120 } });
  if (!res.ok) throw new Error(`/api/news ${res.status}`);
  return res.json();
}

export default async function Page() {
  const [cases, news] = await Promise.all([loadCases(), loadNews()]);
  const topCountry = cases.countries[0] ?? null;
  const latestRelevant: NewsItem | null = news.items.find((i) => i.case_reports.length > 0) ?? null;
  const lastUpdated = news.items[0]?.published_at ?? null;

  return (
    <main className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16 space-y-12 md:space-y-16">
        <Hero
          totals={cases.totals}
          range={cases.range}
          topCountry={topCountry}
          latestRelevant={latestRelevant}
          lastUpdated={lastUpdated}
        />

        <Counters totals={cases.totals} />

        <section className="space-y-3">
          <header className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Geographic distribution</h2>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {cases.points.length} geocoded events
            </span>
          </header>
          <HantaMap points={cases.points} />
        </section>

        <CountryTable rows={cases.countries} />

        <NewsFeed items={news.items} />

        <footer className="border-t border-border/40 pt-6 text-xs text-muted-foreground">
          <p>
            Data refresh: daily at 12:00 UTC. Confidence threshold: {cases.filters.minConfidence}.
            Source code:{" "}
            <a className="underline underline-offset-2" href="https://github.com/anton-pd/hanta">
              github.com/anton-pd/hanta
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
