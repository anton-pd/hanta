import { supabaseServer } from "@/lib/supabase/server";
import { prefilter } from "./prefilter";
import { extractCases } from "@/lib/extract/claude";
import { persistExtraction } from "@/lib/extract/persist";

export interface ProcessSummary {
  scanned: number;
  prefiltered_out: number;
  extracted: number;
  case_reports_inserted: number;
  cost_usd: number;
  errors: number;
}

interface SourceRow {
  id: string;
  url: string;
  title: string | null;
  body: string | null;
  published_at: string | null;
}

// Most items are prefilter-rejected at zero cost; LLM calls are bounded by
// the small subset that pass. 200 keeps total runtime under Vercel's 60s cap
// even when 10–15 articles need extraction.
const MAX_PER_RUN = 200;

// Find sources that have no extraction row yet, and run them through
// prefilter → LLM → persist. Always logs an `extractions` row so each
// source is processed exactly once across runs.
export async function processUnextractedSources(): Promise<ProcessSummary> {
  const sb = supabaseServer();

  // Sources without any extraction row (left-anti-join via NOT IN subquery).
  // PostgREST doesn't support NOT IN with subselects directly — fetch in two
  // steps: candidate sources, then filter out ones with extractions.
  // Two-pass query: pull all high-authority sources first (small set; never
  // truncated by LIMIT), then top up with newest aggregator items. A single
  // query with ORDER BY published_at LIMIT 400 silently dropped older WHO
  // articles when newer GDELT/google_news flooded the front of the queue.
  const HIGH_AUTHORITY = ["who", "paho", "cdc", "ecdc", "promed"];

  const [authRes, restRes] = await Promise.all([
    sb
      .from("unextracted_sources")
      .select("id,url,title,body,published_at,source_type")
      .in("source_type", HIGH_AUTHORITY)
      .order("published_at", { ascending: false, nullsFirst: false }),
    sb
      .from("unextracted_sources")
      .select("id,url,title,body,published_at,source_type")
      .not("source_type", "in", `(${HIGH_AUTHORITY.join(",")})`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(MAX_PER_RUN),
  ]);
  if (authRes.error) throw new Error(`load high-authority: ${authRes.error.message}`);
  if (restRes.error) throw new Error(`load aggregator: ${restRes.error.message}`);

  const todo: SourceRow[] = [...(authRes.data ?? []), ...(restRes.data ?? [])].slice(
    0,
    MAX_PER_RUN,
  );

  if (todo.length === 0) {
    return {
      scanned: 0,
      prefiltered_out: 0,
      extracted: 0,
      case_reports_inserted: 0,
      cost_usd: 0,
      errors: 0,
    };
  }

  let scanned = 0;
  let prefilteredOut = 0;
  let extractedCount = 0;
  let caseReportsInserted = 0;
  let costUsd = 0;
  let errors = 0;

  for (const src of todo) {
    scanned++;
    const pf = prefilter(src.title, src.body);
    if (!pf.passed) {
      prefilteredOut++;
      // Log a rejection row so we don't re-scan this source on the next run.
      await sb.from("extractions").insert({
        source_id: src.id,
        model: "prefilter",
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        result: { reasons: pf.reasons },
        status: "rejected",
      });
      continue;
    }

    const call = await extractCases(src.title, src.body, src.url, src.published_at);
    if (!call.ok) errors++;
    else extractedCount++;
    costUsd += call.cost_usd;

    const persisted = await persistExtraction(src.id, call);
    caseReportsInserted += persisted.inserted_case_reports;
  }

  return {
    scanned,
    prefiltered_out: prefilteredOut,
    extracted: extractedCount,
    case_reports_inserted: caseReportsInserted,
    cost_usd: Number(costUsd.toFixed(6)),
    errors,
  };
}
