import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NewsItem } from "@/lib/api/types";

export default function NewsFeed({ items }: { items: NewsItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest sources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No sources ingested yet.</p>
        )}
        {items.map((it) => {
          const date = it.published_at ? new Date(it.published_at).toISOString().slice(0, 10) : "—";
          const matched = it.case_reports.length > 0;
          return (
            <a
              key={it.id}
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Badge variant={matched ? "default" : "outline"} className="shrink-0 font-mono text-xs">
                  {it.source_type}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">{it.title || it.url}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{date}</span>
                    {matched && (
                      <span className="text-foreground">
                        {it.case_reports
                          .map((r) => `${r.country_iso2} (${r.cases_confirmed}c/${r.deaths}d)`)
                          .join(" · ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}
