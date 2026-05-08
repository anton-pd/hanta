import { z } from "zod";

const Strain = z.enum(["sin_nombre", "andes", "seoul", "puumala", "dobrava"]).optional();

// Common filter shape shared by /api/cases and /api/news.
export const FiltersSchema = z.object({
  // ISO date strings; default to "last 90 days".
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  strain: Strain,
  minConfidence: z.coerce.number().min(0).max(1).default(0.7),
});

export type Filters = z.infer<typeof FiltersSchema>;

export function parseFilters(searchParams: URLSearchParams): Filters {
  const obj = Object.fromEntries(searchParams.entries());
  return FiltersSchema.parse(obj);
}

// Default window when caller doesn't pass `from`: last 90 days.
export function effectiveDateRange(f: Filters): { from: string; to: string } {
  const today = new Date();
  const to = f.to ?? today.toISOString().slice(0, 10);
  const fromDate = f.from
    ? new Date(f.from)
    : new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
  const from = f.from ?? fromDate.toISOString().slice(0, 10);
  return { from, to };
}
