// Minimal ISO 3166-1 alpha-2 → name + flag emoji table.
// Covers hantavirus-endemic countries plus common reporting locales.
// Flag emoji is two regional-indicator codepoints derived from the ISO2.

export function flag(iso2: string): string {
  const code = iso2.toUpperCase();
  if (code.length !== 2) return "🏳️";
  return String.fromCodePoint(
    ...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)),
  );
}

const NAMES: Record<string, string> = {
  // Americas — Sin Nombre / Andes virus territory
  AR: "Argentina", BR: "Brazil", BO: "Bolivia", CL: "Chile", CO: "Colombia",
  CA: "Canada", CR: "Costa Rica", EC: "Ecuador", MX: "Mexico", PA: "Panama",
  PE: "Peru", PY: "Paraguay", US: "United States", UY: "Uruguay", VE: "Venezuela",
  // Europe — Puumala / Dobrava / Seoul
  AT: "Austria", BA: "Bosnia and Herzegovina", BE: "Belgium", CH: "Switzerland",
  CZ: "Czechia", DE: "Germany", EE: "Estonia", ES: "Spain", FI: "Finland",
  FR: "France", GB: "United Kingdom", GR: "Greece", HR: "Croatia", HU: "Hungary",
  IT: "Italy", LT: "Lithuania", LV: "Latvia", NL: "Netherlands", NO: "Norway",
  PL: "Poland", PT: "Portugal", RO: "Romania", RS: "Serbia", RU: "Russia",
  SE: "Sweden", SI: "Slovenia", SK: "Slovakia", UA: "Ukraine",
  // Asia — HFRS
  CN: "China", IN: "India", JP: "Japan", KR: "South Korea", VN: "Vietnam",
  // Africa
  CV: "Cabo Verde", ZA: "South Africa", SH: "Saint Helena",
};

export function countryName(iso2: string): string {
  return NAMES[iso2.toUpperCase()] ?? iso2.toUpperCase();
}
