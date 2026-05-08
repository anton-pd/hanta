import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ExtractionResult, type ExtractionResultT } from "./schema";

const MODEL = "claude-haiku-4-5";

const SYSTEM_PROMPT = `You are a public-health surveillance data extractor. Your job is to read a single news article or social-media post and extract ONLY explicitly stated, NEW human hantavirus case data.

Rules:
- Humans only. Reject animal-only findings (e.g. deer-mouse surveillance).
- Only NEW events. Skip articles that report historical cumulative totals, anniversaries, or background ("what is hantavirus") explainers — set is_relevant=false.
- Do NOT infer numbers. If the article does not explicitly state a count, use 0 for that field.

Counting model (important — read carefully):
- 'cases_confirmed' = the number of distinct people who tested positive for hantavirus, INCLUDING those who later died. Lab-confirmed deaths count as confirmed cases.
- 'cases_suspected' = distinct people with consistent symptoms but no laboratory confirmation yet, INCLUDING presumed deaths without lab confirmation. Suspected and confirmed must NOT double-count the same person.
- 'deaths' = total deaths in this event. Deaths is a subset of (cases_confirmed + cases_suspected) — never independent.
- INVARIANT: deaths must never exceed cases_confirmed + cases_suspected, AND if all deaths were lab-confirmed then deaths ≤ cases_confirmed. Re-read your numbers and adjust before returning.
- If the article reports "X confirmed cases including Y deaths", set cases_confirmed=X and deaths=Y.
- If the article reports "X confirmed and Y deaths" (separate framing), assume deaths overlap with confirmed: set cases_confirmed=max(X, Y) and deaths=Y.

Geographic granularity:
- One event per distinct (country, report_date). For multi-country clusters (e.g. cruise outbreaks), emit ONE event PER country where cases or deaths physically occurred or were laboratory-confirmed — NOT the IHR-notifying country.
- Country must be a valid ISO 3166-1 alpha-2 code, uppercase.

Output:
- evidence_quote must be a verbatim quote (≤ 25 words) from the article supporting the event.
- confidence < 0.6 means do not include the event.
- If unsure whether the article contains relevant new cases, prefer is_relevant=false with empty events.`;

let cachedClient: Anthropic | null = null;
function client(): Anthropic {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

// Haiku 4.5 input/output prices (USD per 1M tokens)
const INPUT_USD_PER_MTOK = 1.0;
const OUTPUT_USD_PER_MTOK = 5.0;
const CACHE_READ_USD_PER_MTOK = 0.1;
const CACHE_WRITE_USD_PER_MTOK = 1.25; // 5-min TTL

function estimateCostUsd(usage: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}): number {
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const uncached = usage.input_tokens; // already excludes cache_*
  return (
    (uncached * INPUT_USD_PER_MTOK +
      cacheRead * CACHE_READ_USD_PER_MTOK +
      cacheWrite * CACHE_WRITE_USD_PER_MTOK +
      usage.output_tokens * OUTPUT_USD_PER_MTOK) /
    1_000_000
  );
}

export interface ExtractCallResult {
  ok: boolean;
  parsed: ExtractionResultT | null;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  cost_usd: number;
  error: string | null;
}

export async function extractCases(
  title: string | null,
  body: string | null,
  url: string,
  publishedAt: string | null,
): Promise<ExtractCallResult> {
  const articleBlock = [
    title ? `Title: ${title}` : null,
    publishedAt ? `Published: ${publishedAt}` : null,
    `URL: ${url}`,
    body ? `Body:\n${body}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    // Cache the static system prompt — only the article varies request to request.
    const response = await client().messages.parse({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: { format: zodOutputFormat(ExtractionResult) },
      messages: [
        {
          role: "user",
          content: `Extract hantavirus case data from this article:\n\n${articleBlock}`,
        },
      ],
    });

    const usage = response.usage;
    return {
      ok: true,
      parsed: response.parsed_output ?? null,
      model: response.model,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
      cost_usd: estimateCostUsd(usage),
      error: null,
    };
  } catch (e) {
    return {
      ok: false,
      parsed: null,
      model: MODEL,
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      cost_usd: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
