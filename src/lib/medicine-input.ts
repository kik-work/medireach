import type { Interaction, Medicine } from "@/lib/types";
import type { MedicineInput } from "@/lib/services/medicine.service";

const FORMS: Medicine["form"][] = ["Tablet", "Capsule", "Syrup", "Injection"];
const SEVERITIES: Interaction["severity"][] = ["minor", "moderate", "major"];

const list = (v: unknown) =>
  (Array.isArray(v) ? v : String(v ?? "").split("\n")).map((s) => String(s).trim()).filter(Boolean);

/**
 * Validates admin input for a medicine (create or edit): identity, price and type only.
 * The clinical data (description, uses, cautions, side effects, interactions) comes from the reviewing doctor.
 */
export function cleanMedicine(raw: Record<string, unknown>): { ok: true; value: MedicineInput } | { ok: false; error: string } {
  const str = (k: string) => String(raw[k] ?? "").trim();
  const required = ["brand", "generic", "strength", "manufacturer", "category"];
  const missing = required.find((k) => !str(k));
  if (missing) return { ok: false, error: `${missing[0].toUpperCase()}${missing.slice(1)} is required.` };
  const price = Number(raw.price);
  if (!(price >= 0)) return { ok: false, error: "Price must be 0 or more." };
  const form = str("form") as Medicine["form"];
  if (!FORMS.includes(form)) return { ok: false, error: "Choose a form." };
  const ingredients = (Array.isArray(raw.ingredients) ? raw.ingredients : String(raw.ingredients ?? "").split(/[\n,]/))
    .map((i) => String(i).trim().toLowerCase())
    .filter(Boolean);

  return {
    ok: true,
    value: {
      brand: str("brand"),
      generic: str("generic"),
      strength: str("strength"),
      form,
      manufacturer: str("manufacturer"),
      category: str("category"),
      rx: raw.rx === true || raw.rx === "on",
      rare: raw.rare === true || raw.rare === "on",
      price,
      ...(ingredients.length && { ingredients }),
    },
  };
}

export interface MedicineReviewInput {
  decision: "approve" | "reject";
  note: string;
  description: string;
  uses: string[];
  cautions: string[];
  sideEffects: string[];
  /** `ingredient` is one of the medicine's own ingredients; `with` is the other ingredient. */
  interactions: { ingredient?: string; with: string; severity: Interaction["severity"]; message: string }[];
}

const MAX_INTERACTIONS = 12;

/** Validates what the reviewing doctor sends: a decision plus the clinical data behind the AI caution layer. */
export function cleanReview(raw: Record<string, unknown>): { ok: true; value: MedicineReviewInput } | { ok: false; error: string } {
  const decision = raw.decision;
  if (decision !== "approve" && decision !== "reject") return { ok: false, error: "Choose approve or reject." };
  const note = String(raw.note ?? "").trim().slice(0, 500);
  const description = String(raw.description ?? "").trim().slice(0, 600);
  const uses = list(raw.uses);
  const cautions = list(raw.cautions);
  const sideEffects = list(raw.sideEffects);

  if (decision === "reject") {
    if (!note) return { ok: false, error: "Tell the admin why you are rejecting this medicine." };
  } else {
    if (!description) return { ok: false, error: "Add a short description." };
    if (uses.length === 0) return { ok: false, error: "Add at least one use." };
    if (cautions.length === 0) return { ok: false, error: "Add at least one caution. It is shown in the AI caution cards." };
  }

  const interactions: MedicineReviewInput["interactions"] = [];
  for (const r of Array.isArray(raw.interactions) ? (raw.interactions as Record<string, unknown>[]) : []) {
    const other = String(r?.with ?? "").trim().toLowerCase();
    const message = String(r?.message ?? "").trim().slice(0, 300);
    if (!other && !message) continue; // an empty row
    if (!other || !message) return { ok: false, error: "Each interaction needs the other ingredient and a message." };
    if (!SEVERITIES.includes(r.severity as Interaction["severity"])) return { ok: false, error: "Choose a severity for each interaction." };
    interactions.push({ ingredient: String(r.ingredient ?? "").trim().toLowerCase() || undefined, with: other, severity: r.severity as Interaction["severity"], message });
  }
  if (interactions.length > MAX_INTERACTIONS) return { ok: false, error: `Add at most ${MAX_INTERACTIONS} interactions.` };

  return { ok: true, value: { decision, note, description, uses, cautions, sideEffects, interactions } };
}
