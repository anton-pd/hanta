import Parser from "rss-parser";
import type { Fetcher, RawItem, SourceType } from "../types";

// Generic RSS fetcher — handles WHO/PAHO/CDC/ECDC/ProMED/Google News with
// shared error handling, timeouts, and field normalization.
export function makeRssFetcher(opts: {
  source: SourceType;
  url: string;
  language?: string;
  // optional client-side filter to skip irrelevant items at the source level
  filter?: (title: string, body: string) => boolean;
}): Fetcher {
  return async () => {
    const errors: string[] = [];
    const items: RawItem[] = [];
    try {
      const parser = new Parser({ timeout: 20000 });
      const feed = await parser.parseURL(opts.url);
      for (const e of feed.items) {
        if (!e.link) continue;
        const title = e.title ?? "";
        const body = (e.contentSnippet || e.content || e.summary) ?? "";
        if (opts.filter && !opts.filter(title, body)) continue;
        items.push({
          url: e.link,
          title: title || null,
          body: body || null,
          published_at:
            e.isoDate ?? (e.pubDate ? new Date(e.pubDate).toISOString() : null),
          language: opts.language ?? null,
          source_type: opts.source,
          raw: { categories: e.categories ?? [], guid: e.guid ?? null },
        });
      }
    } catch (e) {
      errors.push(`${opts.source}: ${e instanceof Error ? e.message : String(e)}`);
    }
    return { source: opts.source, items, errors };
  };
}

// Hantavirus keyword filter for general-purpose feeds (not WHO DON which we
// fetch wholesale). Cheap pre-pre-filter; the proper prefilter runs later.
export const HANTA_RE =
  /hantavirus|HPS|HFRS|sin\s*nombre|andes\s*virus|puumala|seoul\s*virus|síndrome\s*pulmonar/i;

export const onlyHanta = (title: string, body: string) =>
  HANTA_RE.test(title) || HANTA_RE.test(body);
