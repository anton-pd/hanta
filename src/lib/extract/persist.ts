import { supabaseServer } from "@/lib/supabase/server";
import { geocode } from "@/lib/geocode/nominatim";
import type { ExtractCallResult } from "./claude";
import type { ExtractedEventT } from "./schema";

const MIN_CONFIDENCE = 0.6;

export interface PersistResult {
  inserted_case_reports: number;
  rejected_low_confidence: number;
}

export async function persistExtraction(
  sourceId: string,
  call: ExtractCallResult,
): Promise<PersistResult> {
  const sb = supabaseServer();

  // Always log the extraction for auditing/cost tracking, even on error.
  const status = !call.ok
    ? "error"
    : call.parsed && call.parsed.is_relevant && call.parsed.events.length > 0
      ? "ok"
      : "rejected";

  await sb.from("extractions").insert({
    source_id: sourceId,
    model: call.model,
    input_tokens: call.input_tokens,
    output_tokens: call.output_tokens,
    cost_usd: call.cost_usd,
    result: call.parsed ?? { error: call.error },
    status,
  });

  if (!call.ok || !call.parsed || !call.parsed.is_relevant) {
    return { inserted_case_reports: 0, rejected_low_confidence: 0 };
  }

  const accepted: ExtractedEventT[] = [];
  let rejected = 0;
  for (const ev of call.parsed.events) {
    if (ev.confidence < MIN_CONFIDENCE) {
      rejected++;
      continue;
    }
    accepted.push(ev);
  }

  if (accepted.length === 0) {
    return { inserted_case_reports: 0, rejected_low_confidence: rejected };
  }

  // Geocode each event sequentially (Nominatim is rate-limited to 1 req/s).
  const rows = [];
  for (const ev of accepted) {
    const geo = await geocode(ev.locality, ev.region, ev.country_iso2);
    rows.push({
      source_id: sourceId,
      country_iso2: (geo.country_iso2 || ev.country_iso2).toUpperCase(),
      region: ev.region,
      locality: ev.locality,
      lat: geo.lat,
      lon: geo.lon,
      cases_confirmed: ev.cases_confirmed,
      cases_suspected: ev.cases_suspected,
      deaths: ev.deaths,
      report_date: ev.report_date,
      virus_strain: ev.virus_strain === "unknown" ? null : ev.virus_strain,
      confidence: ev.confidence,
      extraction_method: "llm" as const,
      notes: ev.evidence_quote,
    });
  }

  // Plain insert — re-running on same source is prevented by the extractions
  // table (we never re-extract a source). The dedupe-on-(source,country,region,
  // date) index in the migration uses a coalesce expression Postgres won't
  // accept as an ON CONFLICT target, so we don't upsert here.
  const { error } = await sb.from("case_reports").insert(rows);

  if (error) {
    // Don't throw — we already logged extraction; return zero inserts
    return { inserted_case_reports: 0, rejected_low_confidence: rejected };
  }

  return { inserted_case_reports: accepted.length, rejected_low_confidence: rejected };
}
