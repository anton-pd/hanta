import { makeRssFetcher, onlyHanta } from "./rssBase";

// PAHO English news RSS — hantavirus is endemic in the Americas
export const pahoFetcher = makeRssFetcher({
  source: "paho",
  url: "https://www.paho.org/en/rss.xml",
  language: "en",
  filter: onlyHanta,
});

// CDC Health Alert Network RSS
export const cdcFetcher = makeRssFetcher({
  source: "cdc",
  url: "https://emergency.cdc.gov/han/rss.asp",
  language: "en",
  filter: onlyHanta,
});

// ECDC Communicable Disease Threats Report (weekly)
export const ecdcFetcher = makeRssFetcher({
  source: "ecdc",
  url: "https://www.ecdc.europa.eu/en/threats-and-outbreaks/feed",
  language: "en",
  filter: onlyHanta,
});

// ProMED-mail — gold standard outbreak surveillance, hantavirus channel
export const promedFetcher = makeRssFetcher({
  source: "promed",
  url: "https://promedmail.org/promed-posts/rss/?subject=hantavirus",
  language: "en",
});

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
