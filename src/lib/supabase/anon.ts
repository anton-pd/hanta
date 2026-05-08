import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side anon client. RLS allows public read on case_reports + sources.
// Use this for read-only API endpoints — no service-role key on the wire.
let cached: SupabaseClient | null = null;

export function supabaseAnonServer(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
