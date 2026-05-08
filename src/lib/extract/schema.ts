import { z } from "zod";

export const VirusStrain = z.enum([
  "sin_nombre",
  "andes",
  "seoul",
  "puumala",
  "dobrava",
  "unknown",
]);

export const ExtractedEvent = z.object({
  country_iso2: z
    .string()
    .length(2)
    .describe("ISO 3166-1 alpha-2 country code, uppercase, e.g. AR, US, CL"),
  region: z
    .string()
    .nullable()
    .describe("Admin1 region (state/province) when explicitly stated, else null"),
  locality: z
    .string()
    .nullable()
    .describe("City or town when explicitly stated, else null"),
  cases_confirmed: z
    .number()
    .int()
    .min(0)
    .describe("Number of newly confirmed human cases stated in the article. 0 if not stated."),
  cases_suspected: z
    .number()
    .int()
    .min(0)
    .describe("Number of suspected (non-confirmed) human cases. 0 if not stated."),
  deaths: z
    .number()
    .int()
    .min(0)
    .describe("Number of deaths attributable to this event. 0 if not stated."),
  report_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe("ISO date (YYYY-MM-DD) the cases were reported for. Use article publish date if not specified otherwise."),
  virus_strain: VirusStrain.nullable().describe(
    "Strain when stated; null if unknown. Use 'unknown' only if the article explicitly says strain unknown.",
  ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Your confidence (0..1) that this event is real, distinct, and accurately extracted."),
  evidence_quote: z
    .string()
    .max(200)
    .describe("Verbatim quote from the source supporting this event. Under 25 words."),
});

export const ExtractionResult = z.object({
  is_relevant: z
    .boolean()
    .describe("True only if the article contains at least one explicitly-stated NEW human hantavirus case event."),
  events: z
    .array(ExtractedEvent)
    .describe("One entry per distinct (location, date) event. Empty array if is_relevant is false."),
});

export type ExtractedEventT = z.infer<typeof ExtractedEvent>;
export type ExtractionResultT = z.infer<typeof ExtractionResult>;
