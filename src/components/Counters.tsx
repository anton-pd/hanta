import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CasesResponse } from "@/lib/api/types";

export default function Counters({ totals, range }: { totals: CasesResponse["totals"]; range: { from: string; to: string } }) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  const cfr = totals.cases_confirmed > 0 ? (100 * totals.deaths) / totals.cases_confirmed : null;
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Confirmed</CardDescription>
          <CardTitle className="text-3xl">{fmt(totals.cases_confirmed)}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {fmt(totals.cases_suspected)} suspected
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Deaths</CardDescription>
          <CardTitle className="text-3xl">{fmt(totals.deaths)}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {cfr !== null ? `${cfr.toFixed(1)}% case fatality rate` : "—"}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Countries</CardDescription>
          <CardTitle className="text-3xl">{fmt(totals.countries)}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">{fmt(totals.events)} events</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Window</CardDescription>
          <CardTitle className="text-base">
            {range.from} → {range.to}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">last 90 days</CardContent>
      </Card>
    </section>
  );
}
