import { db, nextId, save } from "@/lib/data";
import { isMedicineLive, today } from "@/lib/rules";
import type { MedicineReviewInput } from "@/lib/medicine-input";
import type { Medicine, User } from "@/lib/types";

/**
 * Public view of the catalogue: only medicines a verified doctor approved ("live").
 * A pending or rejected medicine cannot be listed, searched, ordered, prescribed or stocked.
 * `findMedicine` / `listAllMedicines` see everything and are for admin and doctor review screens.
 */
const live = () => db.medicines.filter(isMedicineLive);

export interface MedicineFilter {
  q?: string;
  category?: string;
  rx?: "rx" | "otc";
  rareOnly?: boolean;
}

/** Search by brand, generic name, category or use (disease). */
export function listMedicines(filter: MedicineFilter = {}): Medicine[] {
  const q = filter.q?.trim().toLowerCase();
  return live().filter((m) => {
    if (q) {
      const hay = [m.brand, m.generic, m.category, ...m.uses].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filter.category && m.category !== filter.category) return false;
    if (filter.rx === "rx" && !m.rx) return false;
    if (filter.rx === "otc" && m.rx) return false;
    if (filter.rareOnly && !m.rare) return false;
    return true;
  });
}

export const getMedicineBySlug = (slug: string) => live().find((m) => m.slug === slug);
export const getMedicineById = (id: string) => live().find((m) => m.id === id);
export const listCategories = () => [...new Set(live().map((m) => m.category))].sort();

export const listAllMedicines = () => db.medicines;
export const findMedicine = (slugOrId: string) => db.medicines.find((m) => m.slug === slugOrId || m.id === slugOrId);
export const listPendingMedicines = () => db.medicines.filter((m) => m.review?.status === "pending");
/** A pharmacist's own proposals that are not live yet: waiting for review, or rejected with a reason. */
export const listSubmittedBy = (userId: string) =>
  db.medicines.filter((m) => m.submittedBy === userId && (m.review?.status === "pending" || m.review?.status === "rejected"));

/** Other brands that share an active ingredient with this medicine. */
export function sameIngredientBrands(medicine: Medicine): Medicine[] {
  return live().filter(
    (m) => m.id !== medicine.id && m.ingredients.some((i) => medicine.ingredients.includes(i)),
  );
}

/** What the admin supplies. The doctor adds the clinical data during review. */
export type MedicineInput = Omit<Medicine, "id" | "slug" | "ingredients" | "description" | "uses" | "cautions" | "sideEffects" | "review"> & { ingredients?: string[] };

const slugify = (m: Pick<Medicine, "brand" | "strength">) =>
  `${m.brand}-${m.strength}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Unique slug: appends -2, -3 … when another medicine already has it. */
function uniqueSlug(base: string, ownId?: string) {
  let slug = base;
  for (let n = 2; db.medicines.some((m) => m.slug === slug && m.id !== ownId); n++) slug = `${base}-${n}`;
  return slug;
}

/** New medicines wait for a verified doctor. They are not live until then. */
export function addMedicine(input: MedicineInput, submittedBy?: string) {
  const medicine: Medicine = {
    ...input,
    id: nextId("m", db.medicines.map((m) => m.id)),
    slug: uniqueSlug(slugify(input)),
    ingredients: input.ingredients?.length ? input.ingredients : [input.generic.toLowerCase()],
    description: "",
    uses: [],
    cautions: [],
    sideEffects: [],
    review: { status: "pending" },
    ...(submittedBy && { submittedBy }),
  };
  db.medicines.push(medicine);
  save();
  return medicine;
}

/** A pharmacist may have this many proposals waiting for a doctor at once. */
const MAX_OPEN_SUBMISSIONS = 10;

const isVerifiedPharmacist = (u: User) => u.role === "pharmacist" && u.status === "verified";

/** Same brand, strength and form is the same product, whatever its review state. */
const duplicateOf = (input: MedicineInput, ownId?: string) =>
  db.medicines.find((m) => m.id !== ownId && slugify(m) === slugify(input) && m.form === input.form);

/** A verified pharmacist proposes a medicine that is missing from the catalogue. It goes to doctor review like an admin's. */
export function submitMedicine(pharmacist: User, input: MedicineInput): ReviewResult {
  if (!isVerifiedPharmacist(pharmacist)) return { ok: false, error: "Only a verified pharmacist can add medicines.", status: 403 };
  const dup = duplicateOf(input);
  if (dup) {
    const mine = dup.submittedBy === pharmacist.id && dup.review?.status === "rejected";
    return { ok: false, error: mine ? "You already sent this medicine and a doctor rejected it. Edit it and send it again." : "This medicine is already in the catalogue or waiting for review.", status: 409 };
  }
  if (listSubmittedBy(pharmacist.id).filter((m) => m.review?.status === "pending").length >= MAX_OPEN_SUBMISSIONS) {
    return { ok: false, error: `You already have ${MAX_OPEN_SUBMISSIONS} medicines waiting for review. Wait for a doctor to decide.`, status: 429 };
  }
  return { ok: true, value: addMedicine(input, pharmacist.id) };
}

/** A pharmacist fixes their own rejected proposal and sends it to a doctor again. */
export function resubmitMedicine(pharmacist: User, id: string, input: MedicineInput): ReviewResult {
  if (!isVerifiedPharmacist(pharmacist)) return { ok: false, error: "Only a verified pharmacist can add medicines.", status: 403 };
  const m = findMedicine(id);
  if (!m || m.submittedBy !== pharmacist.id) return { ok: false, error: "Medicine not found.", status: 404 };
  if (m.review?.status !== "rejected") return { ok: false, error: "Only a rejected medicine can be edited and sent again.", status: 409 };
  if (duplicateOf(input, id)) return { ok: false, error: "This medicine is already in the catalogue or waiting for review.", status: 409 };
  return { ok: true, value: updateMedicine(id, input)! };
}

/** Changing these changes what the cautions mean, so a live medicine goes back to review. */
const changesMeaning = (m: Medicine, next: Medicine) =>
  m.generic !== next.generic || m.strength !== next.strength || m.form !== next.form || m.rx !== next.rx ||
  m.ingredients.join("|") !== next.ingredients.join("|");

/**
 * Admin edit. A rejected medicine is sent for review again; a live one goes back to review
 * when generic, ingredients, strength, form or Rx changed. The doctor's clinical data is kept.
 */
export function updateMedicine(id: string, input: MedicineInput) {
  const m = findMedicine(id);
  if (!m) return undefined;
  const next = {
    ...m,
    ...input,
    slug: uniqueSlug(slugify(input), id),
    ingredients: input.ingredients?.length ? input.ingredients : [input.generic.toLowerCase()],
  };
  const resubmit = m.review?.status === "rejected";
  const reReview = isMedicineLive(m) && changesMeaning(m, next);
  Object.assign(m, next);
  if (resubmit || reReview) {
    m.review = { status: "pending", note: reReview ? "Details changed by the admin. Please review again." : undefined };
  }
  save();
  return m;
}

/** Removes the medicine, every pharmacy listing of it and the interactions its doctor added. */
export function deleteMedicine(id: string) {
  const i = db.medicines.findIndex((m) => m.id === id);
  if (i < 0) return false;
  db.medicines.splice(i, 1);
  db.stock = db.stock.filter((s) => s.medicineId !== id);
  db.refills = db.refills.filter((r) => r.medicineId !== id);
  db.interactions = db.interactions.filter((x) => x.source !== id);
  save();
  return true;
}

export type ReviewResult = { ok: true; value: Medicine } | { ok: false; error: string; status: number };

/**
 * A verified doctor decides on a pending medicine.
 * Approve: the doctor's description, uses, cautions, side effects and interactions are saved and the medicine goes live.
 * Reject: the admin sees the reason and can fix the details and send it again.
 */
export function reviewMedicine(id: string, doctor: User, input: MedicineReviewInput): ReviewResult {
  if (doctor.role !== "doctor" || doctor.status !== "verified") return { ok: false, error: "Only a verified doctor can review medicines.", status: 403 };
  const m = findMedicine(id);
  if (!m) return { ok: false, error: "Medicine not found.", status: 404 };
  if (m.review?.status !== "pending") return { ok: false, error: "This medicine was already reviewed.", status: 409 };

  if (input.decision === "reject") {
    m.review = { status: "rejected", reviewedBy: doctor.id, reviewedAt: today(), note: input.note };
  } else {
    m.description = input.description;
    m.uses = input.uses;
    m.cautions = input.cautions;
    m.sideEffects = input.sideEffects;
    m.review = { status: "approved", reviewedBy: doctor.id, reviewedAt: today(), note: input.note || undefined };

    // Replace the pairs this medicine's earlier review added, then add the doctor's.
    db.interactions = db.interactions.filter((x) => x.source !== m.id);
    const seen = new Set<string>();
    for (const r of input.interactions) {
      const ingredient = m.ingredients.includes(r.ingredient ?? "") ? r.ingredient! : m.ingredients[0];
      const key = [ingredient, r.with].sort().join("|");
      if (ingredient === r.with || seen.has(key)) continue;
      seen.add(key);
      db.interactions.push({ pair: [ingredient, r.with], severity: r.severity, message: r.message, source: m.id });
    }
  }
  save();
  return { ok: true, value: m };
}
