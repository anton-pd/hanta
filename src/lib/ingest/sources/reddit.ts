import type { Fetcher, RawItem } from "../types";

interface RedditChild {
  data: {
    permalink?: string;
    url?: string;
    title?: string;
    selftext?: string;
    created_utc?: number;
    subreddit?: string;
  };
}

interface RedditResponse {
  data?: { children?: RedditChild[] };
}

const ENDPOINT =
  "https://www.reddit.com/r/worldnews+Health+medicine+Epidemiology/search.json?q=hantavirus&restrict_sr=1&t=week&limit=50&sort=new";

export const redditFetcher: Fetcher = async () => {
  const errors: string[] = [];
  const items: RawItem[] = [];
  try {
    const res = await fetch(ENDPOINT, {
      headers: {
        "User-Agent": "hanta-tracker/0.1 (anton.leshchenko88@gmail.com)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      errors.push(`reddit: HTTP ${res.status}`);
      return { source: "reddit", items, errors };
    }
    const data = (await res.json()) as RedditResponse;
    for (const c of data.data?.children ?? []) {
      const d = c.data;
      if (!d.permalink) continue;
      const url = `https://www.reddit.com${d.permalink}`;
      items.push({
        url,
        title: d.title ?? null,
        body: d.selftext || null,
        published_at: d.created_utc
          ? new Date(d.created_utc * 1000).toISOString()
          : null,
        language: "en",
        source_type: "reddit",
        raw: { external_url: d.url ?? null, subreddit: d.subreddit ?? null },
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const cause =
      e instanceof Error && e.cause
        ? ` | cause: ${e.cause instanceof Error ? e.cause.message : String(e.cause)}`
        : "";
    errors.push(`reddit: ${msg}${cause}`);
  }
  return { source: "reddit", items, errors };
};
