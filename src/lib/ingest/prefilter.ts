// Cheap regex/keyword/place gate to skip irrelevant items before the LLM.
// Goal: kill ~80% of noise (history pieces, "what is hantavirus" explainers)
// before paying for tokens. False positives are fine — the LLM will reject.

const KEYWORD_RE =
  /hantavirus|HPS|HFRS|sin\s*nombre|andes\s*virus|puumala|seoul\s*virus|síndrome\s*pulmonar/i;

// Either: digit-near-case-word, spelled-out-number-near-case-word, or an
// epidemiology signal word. Articles passing this are case-report-shaped;
// "what is hantavirus" explainers won't.
const DIGIT_NEAR_KEYWORD_RE =
  /\b(\d{1,4})\s+(case|cases|caso|casos|death|deaths|muerte|muertes|fatal|infected|infectado|contagiado|contagios|óbito|óbitos)\b/i;
const SPELLED_NEAR_KEYWORD_RE =
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozens|several)\s+(confirmed|suspected|new|additional)?\s*(case|cases|death|deaths|fatal|infected|patient|patients|hospitali[sz]ed)\b/i;
const EPI_SIGNAL_RE =
  /\b(outbreak|cluster|epidemic|notification|notified|laboratory[- ]confirmed|PCR[- ]confirmed|first case|emerging cluster|confirmed infection|deceased)\b/i;

// Curated gazetteer of countries/regions where hantavirus is endemic + ISO2.
// Used as a place signal. Not exhaustive; LLM will geocode the precise place.
const PLACE_TOKENS: ReadonlyArray<string> = [
  // Americas (Sin Nombre / Andes virus territory)
  "argentina", "chile", "uruguay", "paraguay", "brazil", "brasil", "bolivia",
  "panama", "panamá", "colombia", "venezuela", "ecuador", "peru", "perú",
  "united states", "usa", "u.s.", "canada", "mexico", "méxico",
  "patagonia", "epuyén", "epuyen", "chubut", "neuquén", "neuquen", "rio negro",
  "yosemite", "new mexico", "arizona", "colorado", "utah",
  // Europe (Puumala / Dobrava / Seoul)
  "finland", "sweden", "norway", "germany", "france", "belgium", "netherlands",
  "russia", "ukraine", "slovenia", "croatia", "bosnia", "serbia",
  // Asia (HFRS)
  "china", "south korea", "korea", "japan", "vietnam",
];

const PLACE_RE = new RegExp(
  `\\b(${PLACE_TOKENS.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "i",
);

export interface PrefilterResult {
  passed: boolean;
  reasons: string[]; // why it passed or failed; useful for debugging
}

export function prefilter(title: string | null, body: string | null): PrefilterResult {
  const text = `${title ?? ""}\n${body ?? ""}`.trim();
  if (!text) return { passed: false, reasons: ["empty"] };

  const reasons: string[] = [];
  if (!KEYWORD_RE.test(text)) reasons.push("no-keyword");
  const hasCaseSignal =
    DIGIT_NEAR_KEYWORD_RE.test(text) ||
    SPELLED_NEAR_KEYWORD_RE.test(text) ||
    EPI_SIGNAL_RE.test(text);
  if (!hasCaseSignal) reasons.push("no-case-signal");
  if (!PLACE_RE.test(text)) reasons.push("no-place");

  return { passed: reasons.length === 0, reasons };
}
