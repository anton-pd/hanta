import type { Fetcher, RawItem } from "../types";

interface BskyPost {
  uri: string;
  cid: string;
  author?: { handle?: string; did?: string };
  record?: { text?: string; createdAt?: string; langs?: string[] };
}

interface BskyResponse {
  posts?: BskyPost[];
}

// Convert at:// URI -> public bsky.app URL
function postUrl(uri: string, handle: string | undefined): string {
  const m = uri.match(/^at:\/\/([^/]+)\/app\.bsky\.feed\.post\/(.+)$/);
  if (!m) return uri;
  const id = m[2];
  // Prefer handle over DID for human-readable URL; fallback to did
  const slug = handle || m[1];
  return `https://bsky.app/profile/${slug}/post/${id}`;
}

// Was public.api.bsky.app (now 403). The non-prefixed api.bsky.app works.
const ENDPOINT =
  "https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=hantavirus&limit=50&sort=latest";

export const blueskyFetcher: Fetcher = async () => {
  const errors: string[] = [];
  const items: RawItem[] = [];
  try {
    const res = await fetch(ENDPOINT, {
      headers: { "User-Agent": "hanta-tracker/0.1 (anton.leshchenko88@gmail.com)" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      errors.push(`bluesky: HTTP ${res.status}`);
      return { source: "bluesky", items, errors };
    }
    const data = (await res.json()) as BskyResponse;
    for (const p of data.posts ?? []) {
      if (!p.uri || !p.record?.text) continue;
      items.push({
        url: postUrl(p.uri, p.author?.handle),
        title: null,
        body: p.record.text,
        published_at: p.record.createdAt ?? null,
        language: p.record.langs?.[0] ?? null,
        source_type: "bluesky",
        raw: { uri: p.uri, cid: p.cid, author: p.author?.handle ?? null },
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const cause =
      e instanceof Error && e.cause
        ? ` | cause: ${e.cause instanceof Error ? e.cause.message : String(e.cause)}`
        : "";
    errors.push(`bluesky: ${msg}${cause}`);
  }
  return { source: "bluesky", items, errors };
};
