import Anthropic from "@anthropic-ai/sdk";
import { AI_DISCLAIMER } from "@/lib/constants";
import type { CautionReport, CautionSummary } from "@/lib/types";

/**
 * Optional "generation" step of the caution layer (the G in RAG).
 *
 * The facts are retrieved first by `buildCautionReport` from the curated tables. This step only
 * rewrites those facts as two or three plain sentences. The model gets the report as its only
 * source, is told not to add facts, doses or advice, and the fixed disclaimer is always appended
 * by code, not by the model.
 *
 * Off unless ANTHROPIC_API_KEY is set. Any error returns null and the page shows the
 * retrieval-only cards, which hold all the information anyway.
 */
export const PHRASING_MODEL = process.env.CAUTION_MODEL ?? "claude-opus-5-5";

const SYSTEM = `You rewrite medicine safety facts for patients in Bangladesh, in plain English.

Rules:
- Use only the facts in the JSON you are given. Do not add any medical fact, dose, timing, alternative medicine or advice that is not in it.
- Never tell the patient to start, stop, change or skip a medicine. The doctor decides; you only explain what the facts say.
- Mention every duplicate ingredient and every interaction first, most severe first. If there are none, say that none were found in the database.
- When a fact comes from the patient's profile (profileBrands, profile: true), say it is a medicine already on their profile.
- Write 2 to 4 short sentences of plain text. No headings, lists, markdown or disclaimer: the app adds its own disclaimer.`;

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ timeout: 20_000, maxRetries: 1 }));

/** Same report = same text, so each distinct report is phrased once per server process. */
const cache = new Map<string, CautionSummary | null>();
const MAX_CACHE = 200;

export const phrasingEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

/** The facts the model may use: the report without the disclaimer. */
function facts({ items, duplicates, interactions, rxRequired, profile }: CautionReport) {
  return { items, duplicates, interactions, rxRequired, profile };
}

export async function phraseCautionReport(report: CautionReport): Promise<CautionSummary | null> {
  if (!phrasingEnabled() || report.items.length === 0) return null;
  const input = JSON.stringify(facts(report));
  if (cache.has(input)) return cache.get(input)!;

  let summary: CautionSummary | null = null;
  try {
    const response = await getClient().beta.messages.create({
      model: PHRASING_MODEL,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [{ role: "user", content: `Caution facts (JSON):\n${input}` }],
    });
    if (response.stop_reason !== "refusal") {
      const text = response.content
        .flatMap((b) => (b.type === "text" ? [b.text] : []))
        .join(" ")
        .trim();
      if (text) summary = { text: `${text} ${AI_DISCLAIMER}`, model: response.model };
    }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) console.error("[caution] ANTHROPIC_API_KEY was rejected; phrasing is off.");
    else if (error instanceof Anthropic.RateLimitError) console.warn("[caution] rate limited; showing retrieval-only cards.");
    else if (error instanceof Anthropic.APIError) console.warn(`[caution] API error ${error.status}; showing retrieval-only cards.`);
    else console.warn("[caution] phrasing failed; showing retrieval-only cards.", error);
    // Do not cache failures: a later request may succeed.
    return null;
  }

  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
  cache.set(input, summary);
  return summary;
}
