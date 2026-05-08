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

// Google News RSS — multi-language hantavirus search
const GOOGLE_NEWS_LANGS: Array<{ hl: string; gl: string; ceid: string; lang: string; q: string }> = [
  { hl: "en-US", gl: "US", ceid: "US:en", lang: "en", q: "hantavirus" },
  { hl: "es", gl: "AR", ceid: "AR:es", lang: "es", q: "hantavirus" },
  { hl: "pt-BR", gl: "BR", ceid: "BR:pt-419", lang: "pt", q: "hantavírus" },
];

export const googleNewsFetchers = GOOGLE_NEWS_LANGS.map(({ hl, gl, ceid, lang, q }) =>
  makeRssFetcher({
    source: "google_news",
    url: `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${ceid}`,
    language: lang,
  }),
);
