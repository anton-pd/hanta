// Shared response types for /api/cases and /api/news. Used by both server and
// client components so changes ripple through the type system.

export interface CountryAgg {
  country_iso2: string;
  cases_confirmed: number;
  cases_suspected: number;
  deaths: number;
  events: number;
}

export interface CasePoint {
  country_iso2: string;
  region: string | null;
  locality: string | null;
  lat: number;
  lon: number;
  cases_confirmed: number;
  deaths: number;
  report_date: string;
  confidence: number;
}

export interface CasesResponse {
  range: { from: string; to: string };
  filters: { minConfidence: number; from?: string; to?: string; strain?: string };
  totals: {
    cases_confirmed: number;
    cases_suspected: number;
    deaths: number;
    countries: number;
    events: number;
  };
  countries: CountryAgg[];
  points: CasePoint[];
}

export interface NewsItem {
  id: string;
  url: string;
  title: string | null;
  source_type: string;
  published_at: string | null;
  language: string | null;
  case_reports: Array<{
    country_iso2: string;
    cases_confirmed: number;
    deaths: number;
    report_date: string;
    confidence: number;
  }>;
}

export interface NewsResponse {
  page: number;
  page_size: number;
  items: NewsItem[];
}

export interface HistoricalEvent {
  country_iso2: string;
  region: string | null;
  locality: string | null;
  lat: number | null;
  lon: number | null;
  cases_confirmed: number;
  cases_suspected: number;
  deaths: number;
  report_date: string;
  virus_strain: string | null;
  confidence: number;
  notes: string | null;
  sources: { title: string | null; url: string } | null;
}

export interface HistoricalResponse {
  items: HistoricalEvent[];
}
