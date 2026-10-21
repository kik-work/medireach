/**
 * Curated specialty table behind the doctor finder (same idea as the medicine caution layer:
 * retrieval from a fixed table, no free generation). Keywords are lowercase whole words or phrases;
 * a trailing * matches any ending ("diabet*" finds diabetes and diabetic).
 */
export interface Specialty {
  name: string;
  blurb: string;
  keywords: string[];
  /** Safety note shown with the match. */
  caution: string;
  /** Test reports this kind of doctor usually asks for. */
  reports: string[];
}

export const SPECIALTIES: Specialty[] = [
  {
    name: "General Medicine",
    blurb: "First stop for fever, infections, weakness and anything you cannot place.",
    keywords: ["fever", "cold", "flu", "cough", "weakness", "fatigue", "tired", "body ache", "infection", "typhoid", "dengue", "headache", "blood pressure", "throat", "check up", "checkup"],
    caution: "A general physician can examine you first and refer you to a specialist if needed.",
    reports: ["CBC", "Blood pressure log", "Recent prescription"],
  },
  {
    name: "Cardiology",
    blurb: "Heart and blood-vessel problems.",
    keywords: ["heart", "chest pain", "chest tight*", "palpitat*", "blood pressure", "bp", "hypertens*", "cholesterol", "angina", "ecg", "swollen leg", "breathless*"],
    caution: "Chest pain with sweating, breathlessness or pain spreading to the arm or jaw can be a heart attack. Seek emergency care first.",
    reports: ["ECG", "Echocardiogram", "Lipid profile", "Blood pressure log"],
  },
  {
    name: "Endocrinology",
    blurb: "Diabetes, thyroid and hormone disorders.",
    keywords: ["diabet*", "sugar", "thyroid", "hormone", "insulin", "obesity", "weight gain", "pcos", "hba1c", "goiter"],
    caution: "Very high or very low blood sugar with confusion, vomiting or fainting needs urgent care.",
    reports: ["HbA1c", "Fasting and post-meal blood sugar", "Thyroid profile (TSH, T3, T4)"],
  },
  {
    name: "Neurology",
    blurb: "Brain, nerve and seizure problems.",
    keywords: ["migraine", "seizure", "epilep*", "fits", "numb*", "tingling", "tremor", "dizz*", "memory loss", "nerve", "parkinson*", "severe headache"],
    caution: "Sudden weakness on one side, slurred speech or a sudden severe headache can be a stroke. Go to an emergency department at once.",
    reports: ["MRI or CT scan", "EEG", "Previous neurology prescription"],
  },
  {
    name: "Dermatology",
    blurb: "Skin, hair and nail conditions.",
    keywords: ["skin", "rash", "acne", "pimple", "itch*", "eczema", "psoria*", "hair fall", "hair loss", "dandruff", "fungal", "allerg*", "hives", "wart", "scalp"],
    caution: "A rash with swelling of the face or trouble breathing can be a serious allergic reaction. Seek emergency care.",
    reports: ["Photos of the affected skin", "Allergy test", "List of creams you already use"],
  },
  {
    name: "Gastroenterology",
    blurb: "Stomach, gut and liver problems.",
    keywords: ["stomach", "gastric", "acidity", "heartburn", "ulcer", "diarrh*", "constipat*", "vomit*", "nausea", "bloating", "liver", "jaundice", "abdominal", "belly pain", "piles", "gas"],
    caution: "Black stools, vomiting blood or severe belly pain need urgent care.",
    reports: ["Endoscopy report", "Liver function test", "Stool test", "Ultrasound abdomen"],
  },
  {
    name: "Pulmonology",
    blurb: "Lungs and breathing problems.",
    keywords: ["asthma", "wheez*", "breath*", "lung", "chronic cough", "tuberculosis", "tb", "pneumonia", "bronch*", "snoring", "sleep apnea", "inhaler"],
    caution: "Severe breathlessness, blue lips or coughing blood need emergency care.",
    reports: ["Chest X-ray", "Spirometry", "Sputum test"],
  },
  {
    name: "Paediatrics",
    blurb: "Health care for babies, children and teens.",
    keywords: ["child", "baby", "infant", "kid", "toddler", "newborn", "vaccin*", "growth", "my son", "my daughter", "teething"],
    caution: "A fever in a baby under 3 months, or a child who is very drowsy or will not drink, needs urgent care.",
    reports: ["Vaccination card", "Growth chart", "Recent blood tests"],
  },
  {
    name: "Gynaecology",
    blurb: "Women's health, pregnancy and periods.",
    keywords: ["pregnan*", "period", "menstru*", "pcos", "ovar*", "uterus", "vaginal", "breast", "menopause", "fertility", "antenatal", "white discharge"],
    caution: "Heavy bleeding or severe pain in pregnancy needs emergency care.",
    reports: ["Ultrasound", "Pap smear", "Hormone profile"],
  },
  {
    name: "Orthopaedics",
    blurb: "Bones, joints and muscles.",
    keywords: ["knee", "back pain", "joint", "fracture", "bone", "arthritis", "shoulder", "sprain", "neck pain", "hip", "spine", "muscle pain", "slip disc", "heel"],
    caution: "A suspected broken bone, or back pain with leg weakness or loss of bladder control, needs urgent care.",
    reports: ["X-ray", "MRI", "Uric acid and calcium tests"],
  },
  {
    name: "Psychiatry",
    blurb: "Mental health, mood and sleep.",
    keywords: ["anxiety", "depress*", "stress", "insomnia", "sleep", "panic", "mood", "mental", "sad", "overthinking", "addiction", "phobia"],
    caution: "If you think about harming yourself, call 999 or reach out to someone you trust right now.",
    reports: ["List of current medicines", "Previous psychiatric prescription"],
  },
];

export const SPECIALTY_NAMES = SPECIALTIES.map((s) => s.name);

/** Phrases that may point to an emergency. The finder shows an urgent notice when one appears. */
export const EMERGENCY_TERMS = [
  "chest pain", "heart attack", "stroke", "unconscious", "not breathing", "cannot breathe", "can't breathe", "difficulty breathing",
  "severe bleeding", "heavy bleeding", "vomiting blood", "coughing blood", "slurred speech", "paralysis", "seizure now", "overdose", "poison", "suicid*",
];

export const EMERGENCY_NOTICE =
  "These symptoms can be an emergency. Call 999 or go to the nearest emergency department now. Do not wait for an online appointment.";
