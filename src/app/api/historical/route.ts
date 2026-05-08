import { supabaseAnonServer } from "@/lib/supabase/anon";

// Curated, manually-imported notable past outbreaks (extraction_method='imported').
// Stable enough to cache for an hour.
export const revalidate = 3600;
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const sb = supabaseAnonServer();
  const { data, error } = await sb
    .from("case_reports")
    .select(
      "country_iso2,region,locality,lat,lon,cases_confirmed,cases_suspected,deaths,report_date,virus_strain,confidence,notes,sources(title,url)",
    )
    .eq("extraction_method", "imported")
    .order("report_date", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ items: data ?? [] });
}
