import { supabaseServer } from "@/lib/supabase/server";
import type { RawItem } from "./types";

export async function upsertSources(items: RawItem[]): Promise<{ inserted: number; skipped: number }> {
  if (items.length === 0) return { inserted: 0, skipped: 0 };
  const sb = supabaseServer();

  // Use upsert with onConflict=url, ignoreDuplicates so we don't overwrite existing rows.
  // PostgREST returns the affected rows; we count them as "inserted".
  const { data, error } = await sb
    .from("sources")
    .upsert(items, { onConflict: "url", ignoreDuplicates: true })
    .select("id");

  if (error) throw new Error(`supabase upsert: ${error.message}`);
  const inserted = data?.length ?? 0;
  return { inserted, skipped: items.length - inserted };
}
