import PQueue from "p-queue";
import { supabaseServer } from "@/lib/supabase/server";

// Nominatim usage policy: max 1 req/sec, descriptive UA with contact email.
// We honor it with a module-singleton queue + on-disk cache in geocode_cache.
const queue = new PQueue({ interval: 1100, intervalCap: 1, concurrency: 1 });

const UA =
  process.env.NOMINATIM_USER_AGENT ||
  "hanta-tracker (anton.leshchenko88@gmail.com)";

export interface GeocodeResult {
  lat: number | null;
  lon: number | null;
  country_iso2: string | null;
}

interface NominatimHit {
  lat: string;
  lon: string;
  address?: { country_code?: string };
}

function buildQuery(
  locality: string | null,
  region: string | null,
  countryIso2: string,
): string {
  return [locality, region, countryIso2]
    .filter(Boolean)
    .join(", ")
    .trim()
    .toLowerCase();
}

export async function geocode(
  locality: string | null,
  region: string | null,
  countryIso2: string,
): Promise<GeocodeResult> {
  const q = buildQuery(locality, region, countryIso2);
  if (!q || q.length < 2) return { lat: null, lon: null, country_iso2: countryIso2 };

  const sb = supabaseServer();

  const cached = await sb
    .from("geocode_cache")
    .select("lat,lon,country_iso2")
    .eq("query", q)
    .maybeSingle();
  if (cached.data) {
    return {
      lat: cached.data.lat ?? null,
      lon: cached.data.lon ?? null,
      country_iso2: cached.data.country_iso2 ?? countryIso2,
    };
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  const result = await queue.add(async (): Promise<GeocodeResult> => {
    try {
      const res = await fetch(url.toString(), {
        headers: { "User-Agent": UA, "Accept-Language": "en" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return { lat: null, lon: null, country_iso2: countryIso2 };
      const arr = (await res.json()) as NominatimHit[];
      const hit = arr[0];
      if (!hit) return { lat: null, lon: null, country_iso2: countryIso2 };
      return {
        lat: parseFloat(hit.lat),
        lon: parseFloat(hit.lon),
        country_iso2: (hit.address?.country_code ?? countryIso2).toUpperCase().slice(0, 2),
      };
    } catch {
      return { lat: null, lon: null, country_iso2: countryIso2 };
    }
  });

  const out: GeocodeResult = result ?? { lat: null, lon: null, country_iso2: countryIso2 };

  // Best-effort cache write — don't fail the whole pipeline if this errors
  await sb
    .from("geocode_cache")
    .upsert(
      { query: q, lat: out.lat, lon: out.lon, country_iso2: out.country_iso2 },
      { onConflict: "query" },
    );

  return out;
}
