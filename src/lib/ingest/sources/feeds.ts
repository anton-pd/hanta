import { makeRssFetcher, onlyHanta } from "./rssBase";

// PAHO English news RSS — hantavirus is endemic in the Americas
export const pahoFetcher = makeRssFetcher({
  source: "paho",
  url: "https://www.paho.org/en/rss.xml",
  language: "en",
  filter: onlyHanta,
});

// CDC Health Alert Network — RSS retired by CDC (https://emergency.cdc.gov/han/rss.asp
// 301-redirects to a generic page; tools.cdc.gov topic feed for hantavirus
// returns empty). HAN advisories now publish only via the HAN page or email.
// Re-enable if/when CDC restores a feed; for now WHO/PAHO cover the same ground.

// ECDC — all RSS endpoints (threats-and-outbreaks/feed, communicable-disease-
// threats-report/rss.xml, news-events/rss) return 404 after their 2025 site
// refactor. Their CSV/Excel downloads still exist but are heavier to ingest.
// Parked.

// ProMED-mail — promedmail.org RSS chain redirects to /promed-posts/rss?...
// which returns 404. They appear to require an account or have killed RSS.
// Parked; would need either a paid feed or the bi-weekly email.

// Google News RSS — English only per scope decision (reduces volume; loses
// some Latin-America-specific Spanish/Portuguese coverage where hantavirus
// is most endemic, but cuts ingest volume by ~3× and LLM cost proportionally).
const GOOGLE_NEWS_LANGS: Array<{ hl: string; gl: string; ceid: string; lang: string; q: string }> = [
  { hl: "en-US", gl: "US", ceid: "US:en", lang: "en", q: "hantavirus" },
];

export const googleNewsFetchers = GOOGLE_NEWS_LANGS.map(({ hl, gl, ceid, lang, q }) =>
  makeRssFetcher({
    source: "google_news",
    url: `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${ceid}`,
    language: lang,
  }),
);
