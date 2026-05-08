import { runIngest } from "@/lib/ingest/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization") ?? "";
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET`
  if (auth === `Bearer ${expected}`) return true;
  // Allow ?secret=... for manual triggers (curl from a browser/terminal)
  const url = new URL(req.url);
  return url.searchParams.get("secret") === expected;
}

async function handle(req: Request): Promise<Response> {
  if (!isAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runIngest();
    return Response.json({ ok: true, ...summary });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
