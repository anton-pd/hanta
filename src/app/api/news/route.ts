import { supabaseAnonServer } from "@/lib/supabase/anon";

// 2-minute cache; news feed should feel fresher than the map.
export const revalidate = 120;
export const dynamic = "force-static";

const PAGE_SIZE = 30;

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0", 10) || 0);
  const sb = supabaseAnonServer();

  // Sources joined with their case_reports (if any). PostgREST embedded select.
  const { data, error } = await sb
    .from("sources")
    .select(
      "id,url,title,source_type,published_at,language,case_reports(country_iso2,cases_confirmed,deaths,report_date,confidence)",
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    page,
    page_size: PAGE_SIZE,
    items: data ?? [],
  });
}
