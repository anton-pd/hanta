import Parser from "rss-parser";
import type { Fetcher, RawItem } from "../types";

// Reddit's JSON search endpoints all 403 unauthenticated as of mid-2026.
// /search.rss is still public but Reddit fingerprints the User-Agent and
// rejects rss-parser's default UA — fetch manually with a browser-ish UA
// then hand the body to rss-parser via parseString.
const ENDPOINT =
  "https://www.reddit.com/search.rss?q=hantavirus&restrict_sr=on&sort=new&t=month";

const UA =
  "Mozilla/5.0 (compatible; hanta-tracker/0.1; +https://hanta-mu.vercel.app; anton.leshchenko88@gmail.com)";

export const redditFetcher: Fetcher = async () => {
  const errors: string[] = [];
  const items: RawItem[] = [];
  try {
    const res = await fetch(ENDPOINT, {
      headers: { "User-Agent": UA, Accept: "application/atom+xml,application/xml,*/*" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      errors.push(`reddit: HTTP ${res.status}`);
      return { source: "reddit", items, errors };
    }
    const xml = await res.text();
    const parser = new Parser({ timeout: 20000 });
    const feed = await parser.parseString(xml);
    for (const e of feed.items) {
      if (!e.link) continue;
      items.push({
        url: e.link,
        title: e.title ?? null,
        body: e.contentSnippet || e.content || null,
        published_at:
          e.isoDate ?? (e.pubDate ? new Date(e.pubDate).toISOString() : null),
        language: "en",
        source_type: "reddit",
        raw: { author: e.creator ?? null, categories: e.categories ?? [] },
      });
    }
  } catch (e) {
    errors.push(`reddit: ${e instanceof Error ? e.message : String(e)}`);
  }
  return { source: "reddit", items, errors };
};
