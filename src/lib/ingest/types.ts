export type SourceType =
  | "who"
  | "gdelt"
  | "google_news"
  | "reddit"
  | "bluesky"
  | "promed"
  | "cdc"
  | "ecdc"
  | "paho";

export interface RawItem {
  url: string;
  title: string | null;
  body: string | null;
  published_at: string | null; // ISO8601
  language: string | null;
  source_type: SourceType;
  raw: Record<string, unknown>;
}

export interface FetcherResult {
  source: SourceType;
  items: RawItem[];
  errors: string[];
}

export type Fetcher = () => Promise<FetcherResult>;
