import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-12">
          <Badge variant="outline" className="mb-3">v0 — scaffolding</Badge>
          <h1 className="text-4xl font-bold tracking-tight">Hantavirus Tracker</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Public dashboard ingesting global news and social feeds, extracting
            confirmed hantavirus case data via an LLM pipeline, and rendering a
            live heatmap.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Cases (global)</CardTitle>
              <CardDescription>placeholder</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">—</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Deaths</CardTitle>
              <CardDescription>placeholder</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">—</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Countries</CardTitle>
              <CardDescription>placeholder</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">—</CardContent>
          </Card>
        </section>

        <section className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Build status</CardTitle>
              <CardDescription>Session 1 — project skeleton</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Next.js 16 + Tailwind + shadcn/ui wired</li>
                <li>✓ Vercel deployment + GitHub auto-deploy</li>
                <li>✓ Supabase client stubs ready (waiting on project)</li>
                <li>· Next: Supabase project + migration + ingestion fetchers</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
