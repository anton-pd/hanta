import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { CountryAgg } from "@/lib/api/types";

export default function CountryTable({ rows }: { rows: CountryAgg[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>By country</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No cases in this window — pipeline is still warming up. Check back after the next hourly ingest.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>By country</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">Confirmed</TableHead>
              <TableHead className="text-right">Suspected</TableHead>
              <TableHead className="text-right">Deaths</TableHead>
              <TableHead className="text-right">CFR</TableHead>
              <TableHead className="text-right">Events</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const cfr = r.cases_confirmed > 0 ? (100 * r.deaths) / r.cases_confirmed : null;
              return (
                <TableRow key={r.country_iso2}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{r.country_iso2}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.cases_confirmed}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{r.cases_suspected}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.deaths}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {cfr !== null ? `${cfr.toFixed(0)}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{r.events}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
