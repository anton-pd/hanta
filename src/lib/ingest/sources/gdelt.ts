import type { Fetcher, RawItem } from "../types";

interface GdeltArticle {
  url: string;
  title?: string;
  seendate?: string; // YYYYMMDDTHHMMSSZ
  language?: string;
  domain?: string;
  sourcecountry?: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

const ENDPOINT =
  "https://api.gdeltproject.org/api/v2/doc/doc?query=hantavirus&format=json&maxrecords=250&timespan=24h&sort=datedesc";

function parseSeenDate(s: string | undefined): string | null {
  if (!s || s.length < 15) return null;
  // 20260507T140532Z -> 2026-05-07T14:05:32Z
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export const gdeltFetcher: Fetcher = async () => {
  const errors: string[] = [];
  const items: RawItem[] = [];
  try {
    const res = await fetch(ENDPOINT, {
      headers: { "User-Agent": "hanta-tracker (anton.leshchenko88@gmail.com)" },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      errors.push(`gdelt: HTTP ${res.status}`);
      return { source: "gdelt", items, errors };
    }
    // GDELT sometimes returns text/html on empty results — guard
    const text = await res.text();
    let data: GdeltResponse = {};
    try {
      data = JSON.parse(text) as GdeltResponse;
    } catch {
      // empty response is acceptable, just no items
      return { source: "gdelt", items, errors };
    }
    for (const a of data.articles ?? []) {
      if (!a.url) continue;
      items.push({
        url: a.url,
        title: a.title ?? null,
        body: null, // GDELT returns no body in DOC API
        published_at: parseSeenDate(a.seendate),
        language: a.language ?? null,
        source_type: "gdelt",
        raw: { domain: a.domain ?? null, sourcecountry: a.sourcecountry ?? null },
      });
    }
  } catch (e) {
    errors.push(`gdelt: ${e instanceof Error ? e.message : String(e)}`);
  }
  return { source: "gdelt", items, errors };
};
