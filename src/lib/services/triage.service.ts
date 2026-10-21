import { AI_DISCLAIMER } from "@/lib/constants";
import { EMERGENCY_NOTICE, EMERGENCY_TERMS, SPECIALTIES, type Specialty } from "@/lib/specialties";
import { listPublicProfiles } from "./doctor.service";

export interface SpecialtyMatch {
  specialty: string;
  blurb: string;
  /** Words from the patient's text that led to this match. */
  matched: string[];
  caution: string;
  reports: string[];
  /** Verified doctors of this specialty, best fit first. Several on purpose: if one is unavailable, the next is right there. */
  doctorIds: string[];
}

export interface TriageResult {
  query: string;
  /** Set when the text mentions a possible emergency. */
  emergency: string | null;
  matches: SpecialtyMatch[];
  /** true when nothing matched and General Medicine is suggested as the safe first step. */
  fallback: boolean;
  disclaimer: string;
}

/** "diabet*" matches any ending; other terms match as whole words or phrases (plural allowed). */
function termRegex(term: string) {
  const stem = term.endsWith("*");
  const escaped = (stem ? term.slice(0, -1) : term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(stem ? `\\b${escaped}\\w*` : `\\b${escaped}(?:s|es)?\\b`);
}

/** The words in the text that match any term, as the patient wrote them. */
const hits = (text: string, terms: string[]) => terms.flatMap((t) => text.match(termRegex(t))?.[0] ?? []);

/** Doctors of one specialty: accepting first, then those who list the patient's words, then by rating. */
function rankDoctors(specialty: Specialty, text: string) {
  const words = text.split(/[^a-z0-9']+/).filter((w) => w.length > 2);
  const fit = (treats: string[]) => treats.filter((t) => words.some((w) => t.includes(w))).length;
  return listPublicProfiles()
    .filter((p) => p.specialty === specialty.name)
    .sort((a, b) => Number(b.accepting) - Number(a.accepting) || fit(b.treats) - fit(a.treats) || b.rating - a.rating)
    .map((p) => p.doctorId);
}

/**
 * AI doctor finder (retrieval, not free generation).
 * Matches the patient's words to the curated specialty table and lists every verified doctor of the
 * best matches. It never diagnoses; it only points to the kind of doctor to see.
 */
export function findDoctors(rawQuery: string): TriageResult {
  const query = rawQuery.trim().slice(0, 300);
  const text = query.toLowerCase();

  const scored = SPECIALTIES.map((s) => ({ s, matched: hits(text, s.keywords) }))
    .filter((x) => x.matched.length > 0)
    .sort((a, b) => b.matched.length - a.matched.length)
    .slice(0, 3);

  const fallback = scored.length === 0;
  const picks = fallback ? [{ s: SPECIALTIES[0], matched: [] as string[] }] : scored;

  return {
    query,
    emergency: hits(text, EMERGENCY_TERMS).length > 0 ? EMERGENCY_NOTICE : null,
    fallback,
    matches: picks.map(({ s, matched }) => ({
      specialty: s.name,
      blurb: s.blurb,
      matched,
      caution: s.caution,
      reports: s.reports,
      doctorIds: rankDoctors(s, text),
    })),
    disclaimer: `${AI_DISCLAIMER} This finder points to a kind of doctor. It does not diagnose.`,
  };
}
