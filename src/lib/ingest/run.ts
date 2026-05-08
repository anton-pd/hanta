import { supabaseServer } from "@/lib/supabase/server";
import type { Fetcher, FetcherResult } from "./types";
import { whoFetcher } from "./sources/who";
import { gdeltFetcher } from "./sources/gdelt";
import { pahoFetcher, googleNewsFetchers } from "./sources/feeds";
import { redditFetcher } from "./sources/reddit";
import { blueskyFetcher } from "./sources/bluesky";
import { upsertSources } from "./upsert";
import { processUnextractedSources, type ProcessSummary } from "./process";

const FETCHERS: Fetcher[] = [
  whoFetcher,
  gdeltFetcher,
  pahoFetcher,
  ...googleNewsFetchers,
  redditFetcher,
  blueskyFetcher,
];

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
  extraction: ProcessSummary;
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

  let extraction: ProcessSummary;
  try {
    extraction = await processUnextractedSources();
  } catch (e) {
    extraction = {
      scanned: 0,
      prefiltered_out: 0,
      extracted: 0,
      case_reports_inserted: 0,
      cost_usd: 0,
      errors: 1,
    };
    per_source.push({
      source: "extraction",
      fetched: 0,
      inserted: 0,
      skipped: 0,
      errors: [e instanceof Error ? e.message : String(e)],
    });
  }

  // Refresh the daily_country_totals materialized view for fast dashboard reads.
  // Uses a SQL RPC since PostgREST can't issue REFRESH MATERIALIZED VIEW directly.
  if (extraction.case_reports_inserted > 0) {
    try {
      await supabaseServer().rpc("refresh_daily_country_totals");
    } catch {
      // Non-fatal — view will still serve stale data; create the function next deploy
    }
  }

  return {
    per_source,
    total_inserted,
    total_fetched,
    extraction,
    duration_ms: Date.now() - t0,
  };
}
