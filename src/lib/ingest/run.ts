import type { Fetcher, FetcherResult } from "./types";
import { whoFetcher } from "./sources/who";
import { gdeltFetcher } from "./sources/gdelt";
import { upsertSources } from "./upsert";

const FETCHERS: Fetcher[] = [whoFetcher, gdeltFetcher];

export interface IngestRunSummary {
  per_source: Array<{
    source: string;
    fetched: number;
    inserted: number;
    skipped: number;
    errors: string[];
  }>;
  total_inserted: number;
  total_fetched: number;
  duration_ms: number;
}

export async function runIngest(): Promise<IngestRunSummary> {
  const t0 = Date.now();
  const fetched: FetcherResult[] = await Promise.all(FETCHERS.map((f) => f()));

  const per_source: IngestRunSummary["per_source"] = [];
  let total_inserted = 0;
  let total_fetched = 0;

  for (const r of fetched) {
    total_fetched += r.items.length;
    let inserted = 0;
    let skipped = 0;
    const errors = [...r.errors];
    if (r.items.length > 0) {
      try {
        const out = await upsertSources(r.items);
        inserted = out.inserted;
        skipped = out.skipped;
      } catch (e) {
        errors.push(`upsert: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    total_inserted += inserted;
    per_source.push({
      source: r.source,
      fetched: r.items.length,
      inserted,
      skipped,
      errors,
    });
  }

  return {
    per_source,
    total_inserted,
    total_fetched,
    duration_ms: Date.now() - t0,
  };
}
