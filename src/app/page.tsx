import { headers } from "next/headers";
import Counters from "@/components/Counters";
import CountryTable from "@/components/CountryTable";
import NewsFeed from "@/components/NewsFeed";
import HantaMap from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import type { CasesResponse, NewsResponse } from "@/lib/api/types";

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
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12 space-y-8">
        <header className="space-y-2">
          <Badge variant="outline">v0 — public beta</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Hantavirus Tracker</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            Confirmed human hantavirus case data extracted from public news and authoritative
            outbreak surveillance feeds (WHO Disease Outbreak News, GDELT, PAHO, Google News) by
            an LLM extractor and surfaced here. <strong>Not an official surveillance source.</strong>{" "}
            See <a className="underline underline-offset-2" href="/about">methodology</a>.
          </p>
        </header>

        <Counters totals={cases.totals} range={cases.range} />

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Geographic distribution</h2>
          <HantaMap points={cases.points} />
        </section>

        <CountryTable rows={cases.countries} />

        <NewsFeed items={news.items} />

        <footer className="pt-8 text-xs text-muted-foreground">
          Data refresh: hourly. Window: {cases.range.from} → {cases.range.to}. Confidence threshold: {cases.filters.minConfidence}.
        </footer>
      </div>
    </main>
  );
}
