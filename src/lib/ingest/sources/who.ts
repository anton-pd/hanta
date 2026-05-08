import type { Fetcher, RawItem } from "../types";

interface WhoDon {
  Id: string;
  Title?: string;
  OverrideTitle?: string;
  UseOverrideTitle?: boolean;
  PublicationDateAndTime?: string;
  UrlName?: string;
  Overview?: string;
  Summary?: string;
}

interface WhoApiResponse {
  value?: WhoDon[];
}

const ENDPOINT =
  "https://www.who.int/api/news/diseaseoutbreaknews?$top=50&$orderby=PublicationDateAndTime%20desc";

const stripHtml = (s: string | undefined): string | null =>
  s ? s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : null;

export const whoFetcher: Fetcher = async () => {
  const errors: string[] = [];
  const items: RawItem[] = [];
  try {
    const res = await fetch(ENDPOINT, {
      headers: { "User-Agent": "hanta-tracker (anton.leshchenko88@gmail.com)" },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      errors.push(`who: HTTP ${res.status}`);
      return { source: "who", items, errors };
    }
    const data = (await res.json()) as WhoApiResponse;
    for (const d of data.value ?? []) {
      if (!d.UrlName) continue;
      const url = `https://www.who.int/emergencies/disease-outbreak-news/item/${d.UrlName}`;
      const title = (d.UseOverrideTitle && d.OverrideTitle) || d.Title || null;
      const body = stripHtml(d.Overview ?? d.Summary);
      items.push({
        url,
        title,
        body,
        published_at: d.PublicationDateAndTime ?? null,
        language: "en",
        source_type: "who",
        raw: { id: d.Id },
      });
    }
  } catch (e) {
    errors.push(`who: ${e instanceof Error ? e.message : String(e)}`);
  }
  return { source: "who", items, errors };
};
