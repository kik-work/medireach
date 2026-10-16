import type { Interaction } from "@/lib/types";

/** Curated interaction table. Pairs use lowercase ingredient names. */
export const interactions: Interaction[] = [
  { pair: ["warfarin", "aspirin"], severity: "major", message: "Both increase bleeding risk. Combination needs strict medical supervision." },
  { pair: ["clopidogrel", "omeprazole"], severity: "moderate", message: "Omeprazole may reduce the antiplatelet effect of clopidogrel. Ask your doctor about an alternative." },
  { pair: ["aspirin", "ibuprofen"], severity: "moderate", message: "Ibuprofen can block the heart-protective effect of aspirin and raises stomach-bleeding risk." },
  { pair: ["tacrolimus", "azithromycin"], severity: "major", message: "Azithromycin can raise tacrolimus blood levels. Monitoring is required." },
  { pair: ["atorvastatin", "azithromycin"], severity: "minor", message: "Small increase in muscle-injury risk. Report unexplained muscle pain." },
  { pair: ["warfarin", "paracetamol"], severity: "minor", message: "Regular high-dose paracetamol can increase the effect of warfarin (INR)." },
  { pair: ["ibuprofen", "amlodipine"], severity: "minor", message: "NSAIDs may weaken the blood-pressure-lowering effect of amlodipine." },
  { pair: ["warfarin", "azithromycin"], severity: "moderate", message: "Azithromycin may increase the effect of warfarin. INR check advised." },
];
