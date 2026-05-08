import { countryName, flag } from "@/lib/countries";
import type { CountryAgg } from "@/lib/api/types";

export default function CountryTable({ rows }: { rows: CountryAgg[] }) {
  const max = rows.reduce((m, r) => Math.max(m, r.cases_confirmed + r.cases_suspected, r.deaths), 1);

  return (
    <section className="rounded-2xl border border-border/60 bg-card/30 p-5 backdrop-blur-sm">
      <header className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl">By country</h2>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {rows.length} {rows.length === 1 ? "country" : "countries"}
        </span>
      </header>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No cases in this window — pipeline is still warming up.
        </p>
      ) : (
        <div className="mt-5 divide-y divide-border/50">
          <div className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_3rem_3rem] items-center gap-3 pb-2 text-xs uppercase tracking-wider text-muted-foreground md:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_4.5rem_4.5rem_4rem]">
            <span>Country</span>
            <span className="text-right">Conf</span>
            <span className="text-right">Susp</span>
            <span className="text-right">Deaths</span>
            <span className="text-right md:block hidden">CFR</span>
            <span className="text-right">Evt</span>
          </div>
          {rows.map((r) => {
            const total = r.cases_confirmed + r.cases_suspected;
            const cfr = r.cases_confirmed > 0 ? `${Math.round((100 * r.deaths) / r.cases_confirmed)}%` : "—";
            const confW = `${(r.cases_confirmed / max) * 100}%`;
            const suspW = `${(r.cases_suspected / max) * 100}%`;
            return (
              <div
                key={r.country_iso2}
                className="grid grid-cols-[minmax(0,1fr)_3rem_3rem_3rem_3rem] items-center gap-3 py-3 md:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_4.5rem_4.5rem_4rem]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{flag(r.country_iso2)}</span>
                    <span className="truncate text-sm font-medium">{countryName(r.country_iso2)}</span>
                    <span className="font-mono text-xs text-muted-foreground">{r.country_iso2}</span>
                  </div>
                  <div className="mt-1.5 flex h-1 w-full overflow-hidden rounded-full bg-border/30">
                    <div className="h-full bg-amber-400/80" style={{ width: confW }} />
                    <div className="h-full bg-yellow-300/50" style={{ width: suspW }} />
                  </div>
                </div>
                <span className="tabular text-right text-sm text-amber-300">{r.cases_confirmed}</span>
                <span className="tabular text-right text-sm text-yellow-300/80">{r.cases_suspected}</span>
                <span className="tabular text-right text-sm text-rose-400">{r.deaths}</span>
                <span className="tabular text-right text-sm text-muted-foreground hidden md:block">{cfr}</span>
                <span className="tabular text-right text-sm text-muted-foreground">{total > 0 ? r.events : "—"}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
