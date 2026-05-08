import { supabaseAnonServer } from "@/lib/supabase/anon";
import { parseFilters, effectiveDateRange } from "@/lib/api/filters";

// Cache for 5 minutes; the underlying data updates at most hourly.
export const revalidate = 300;
export const dynamic = "force-static";

interface CountryRow {
  country_iso2: string;
  cases_confirmed: number;
  deaths: number;
  cases_suspected: number;
  events: number;
}

interface PointRow {
  country_iso2: string;
  region: string | null;
  locality: string | null;
  lat: number;
  lon: number;
  cases_confirmed: number;
  deaths: number;
  report_date: string;
  confidence: number;
}

interface Totals {
  cases_confirmed: number;
  cases_suspected: number;
  deaths: number;
  countries: number;
  events: number;
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  let filters;
  try {
    filters = parseFilters(url.searchParams);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "bad params" },
      { status: 400 },
    );
  }
  const { from, to } = effectiveDateRange(filters);

  const sb = supabaseAnonServer();
  let q = sb
    .from("case_reports")
    .select(
      "country_iso2,region,locality,lat,lon,cases_confirmed,cases_suspected,deaths,report_date,virus_strain,confidence",
    )
    .gte("report_date", from)
    .lte("report_date", to)
    .gte("confidence", filters.minConfidence)
    .order("report_date", { ascending: false })
    .limit(5000);

  if (filters.strain) q = q.eq("virus_strain", filters.strain);

  const { data, error } = await q;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  const rows = data ?? [];

  // Country aggregates for choropleth
  const byCountry = new Map<string, CountryRow>();
  let casesConfirmed = 0;
  let casesSuspected = 0;
  let deaths = 0;
  for (const r of rows) {
    casesConfirmed += r.cases_confirmed ?? 0;
    casesSuspected += r.cases_suspected ?? 0;
    deaths += r.deaths ?? 0;
    const c = byCountry.get(r.country_iso2) ?? {
      country_iso2: r.country_iso2,
      cases_confirmed: 0,
      deaths: 0,
      cases_suspected: 0,
      events: 0,
    };
    c.cases_confirmed += r.cases_confirmed ?? 0;
    c.cases_suspected += r.cases_suspected ?? 0;
    c.deaths += r.deaths ?? 0;
    c.events += 1;
    byCountry.set(r.country_iso2, c);
  }

  // Locality-level points for heat layer (only rows with coords)
  const points: PointRow[] = rows
    .filter((r) => r.lat != null && r.lon != null)
    .map((r) => ({
      country_iso2: r.country_iso2,
      region: r.region,
      locality: r.locality,
      lat: r.lat as number,
      lon: r.lon as number,
      cases_confirmed: r.cases_confirmed ?? 0,
      deaths: r.deaths ?? 0,
      report_date: r.report_date,
      confidence: r.confidence,
    }));

  const totals: Totals = {
    cases_confirmed: casesConfirmed,
    cases_suspected: casesSuspected,
    deaths,
    countries: byCountry.size,
    events: rows.length,
  };

  return Response.json({
    range: { from, to },
    filters,
    totals,
    countries: Array.from(byCountry.values()).sort(
      (a, b) => b.cases_confirmed - a.cases_confirmed,
    ),
    points,
  });
}
