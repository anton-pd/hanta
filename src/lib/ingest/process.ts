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

const MAX_PER_RUN = 50;

// Find sources that have no extraction row yet, and run them through
// prefilter → LLM → persist. Always logs an `extractions` row so each
// source is processed exactly once across runs.
export async function processUnextractedSources(): Promise<ProcessSummary> {
  const sb = supabaseServer();

  // Sources without any extraction row (left-anti-join via NOT IN subquery).
  // PostgREST doesn't support NOT IN with subselects directly — fetch in two
  // steps: candidate sources, then filter out ones with extractions.
  // High-authority sources (WHO, PAHO, CDC, ECDC, ProMED) processed first.
  // GDELT/news aggregators last because their titles alone rarely pass prefilter.
  const AUTHORITY_RANK: Record<string, number> = {
    who: 0, paho: 0, cdc: 0, ecdc: 0, promed: 0,
    bluesky: 1, reddit: 1, google_news: 1, gdelt: 2,
  };
  const { data: rawCandidates, error: e1 } = await sb
    .from("sources")
    .select("id,url,title,body,published_at,source_type")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(MAX_PER_RUN * 6); // overfetch; we'll re-rank then trim
  const candidates = (rawCandidates ?? []).slice().sort((a, b) => {
    const ra = AUTHORITY_RANK[a.source_type as string] ?? 9;
    const rb = AUTHORITY_RANK[b.source_type as string] ?? 9;
    if (ra !== rb) return ra - rb;
    return (b.published_at ?? "").localeCompare(a.published_at ?? "");
  });

  if (e1) throw new Error(`load sources: ${e1.message}`);
  if (!candidates || candidates.length === 0) {
    return {
      scanned: 0,
      prefiltered_out: 0,
      extracted: 0,
      case_reports_inserted: 0,
      cost_usd: 0,
      errors: 0,
    };
  }

  const ids = candidates.map((c) => c.id);
  const { data: extracted, error: e2 } = await sb
    .from("extractions")
    .select("source_id")
    .in("source_id", ids);
  if (e2) throw new Error(`load extractions: ${e2.message}`);
  const extractedIds = new Set((extracted ?? []).map((r) => r.source_id));

  const todo: SourceRow[] = candidates
    .filter((c) => !extractedIds.has(c.id))
    .slice(0, MAX_PER_RUN);

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
