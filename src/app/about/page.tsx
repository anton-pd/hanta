export const metadata = {
  title: "Methodology — Hantavirus Tracker",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 prose prose-sm md:prose-base prose-neutral dark:prose-invert">
        <h1>Methodology</h1>
        <p className="lead">
          Hantavirus Tracker ingests public news feeds and authoritative outbreak surveillance
          channels, uses an LLM to extract explicitly-stated confirmed human case counts, and
          aggregates them on a global map. <strong>This is not an official surveillance source.</strong>
        </p>

        <h2>Data sources</h2>
        <ul>
          <li><strong>WHO Disease Outbreak News</strong> — primary, highest authority</li>
          <li><strong>GDELT 2.0 DOC API</strong> — global news index, hantavirus query, 24h window</li>
          <li><strong>PAHO news</strong> — Pan American Health Organization</li>
          <li><strong>Google News RSS</strong> — English language, hantavirus query</li>
        </ul>

        <h2>Extraction pipeline</h2>
        <ol>
          <li>
            <strong>Fetch.</strong> Hourly cron pulls new items from each source, deduped by URL.
          </li>
          <li>
            <strong>Pre-filter.</strong> A keyword + place + epidemiology-signal regex
            cheaply rejects items that aren&apos;t about specific case events.
          </li>
          <li>
            <strong>LLM extract.</strong> <code>claude-haiku-4-5</code> reads each surviving
            article and returns a structured event list (country, locality, confirmed cases,
            deaths, date, virus strain, confidence) bound to a JSON schema.
          </li>
          <li>
            <strong>Geocode.</strong> Each event&apos;s locality is resolved to lat/lon via
            Nominatim (OpenStreetMap), respecting their 1 req/sec policy with a cache.
          </li>
          <li>
            <strong>Persist.</strong> Events with confidence ≥ 0.6 are written to the public
            database; the LLM&apos;s evidence quote is preserved for auditing.
          </li>
        </ol>

        <h2>Confidence and filtering</h2>
        <p>
          The dashboard defaults to events with model self-reported confidence ≥ 0.7. The
          extractor is instructed to omit any field not explicitly stated in the source, refuse
          animal-only findings, and reject historical / explainer articles outright.
        </p>

        <h2>Caveats</h2>
        <ul>
          <li>Coverage is biased toward English-language sources at present.</li>
          <li>The same outbreak may be double-counted across multiple sources.</li>
          <li>LLMs occasionally mis-extract — every event has an evidence quote you can verify.</li>
          <li>This site is for public situational awareness, not clinical or policy decisions.</li>
        </ul>

        <p className="text-xs text-muted-foreground">
          Source: <a href="https://github.com/anton-pd/hanta">github.com/anton-pd/hanta</a>
        </p>
      </div>
    </main>
  );
}
