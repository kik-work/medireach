import { DEFAULT_DAYS } from "@/lib/consult";
import type { City, DoctorProfile, User, VerificationStatus } from "@/lib/types";

const MORNING = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const EVENING = ["17:00", "17:30", "18:00", "18:30", "19:00"];
const MIXED = ["10:00", "10:30", "11:00", "11:30", "17:00", "17:30", "18:00"];
const WEEKDAYS = [0, 1, 2, 3, 4];

interface Extra {
  email?: string;
  registrationNo?: string;
  status?: VerificationStatus;
  accepting?: boolean;
  times?: string[];
  days?: number[];
}

/** id, name, city, specialty, qualifications, years, fee (BDT), rating, conditions treated, extras. */
type Row = [string, string, City, string, string, number, number, number, string, Extra?];

/**
 * Several doctors per specialty on purpose: when one cannot take a patient
 * (on leave, fully booked), the patient sees the others right next to them.
 */
const rows: Row[] = [
  ["u-doc1", "Farhana Akter", "Dhaka", "General Medicine", "MBBS, FCPS (Medicine)", 12, 800, 4.8, "fever, infection, hypertension, diabetes, epilepsy, allergy, check up", { email: "doctor@medireach.com", registrationNo: "BMDC-A-45821", times: MIXED }],
  ["u-doc13", "Kabir Hossain", "Dhaka", "General Medicine", "MBBS, MD (Internal Medicine)", 9, 700, 4.6, "fever, cold, flu, typhoid, dengue, weakness, headache", { times: EVENING }],
  ["u-doc14", "Shirin Sultana", "Chattogram", "General Medicine", "MBBS, MRCP", 15, 900, 4.7, "fever, infection, fatigue, blood pressure, body ache", { times: MORNING }],

  ["u-doc4", "Tanvir Rahman", "Dhaka", "Cardiology", "MBBS, MD (Cardiology)", 14, 1500, 4.9, "heart disease, chest pain, hypertension, palpitation, cholesterol", { accepting: false, times: MORNING }],
  ["u-doc5", "Nusrat Sultana", "Dhaka", "Cardiology", "MBBS, FCPS (Cardiology)", 10, 1300, 4.7, "hypertension, high cholesterol, heart failure, palpitation, ecg", { days: WEEKDAYS, times: MIXED }],
  ["u-doc6", "Mahfuz Alam", "Chattogram", "Cardiology", "MBBS, MD (Cardiology)", 18, 1600, 4.8, "heart disease, chest pain, blood pressure, angina", { times: EVENING }],

  ["u-doc7", "Rubina Haque", "Dhaka", "Endocrinology", "MBBS, MD (Endocrinology)", 11, 1200, 4.8, "diabetes, thyroid, pcos, obesity, hormone problems", { times: MORNING }],
  ["u-doc8", "Shafiq Ahmed", "Sylhet", "Endocrinology", "MBBS, FCPS (Medicine), CCD", 13, 1100, 4.6, "diabetes, thyroid, insulin, weight gain", { times: EVENING }],

  ["u-doc9", "Mehnaz Khan", "Dhaka", "Neurology", "MBBS, MD (Neurology)", 12, 1500, 4.8, "migraine, epilepsy, seizure, numbness, tremor, memory loss", { times: MIXED }],
  ["u-doc10", "Arif Mahmud", "Rajshahi", "Neurology", "MBBS, FCPS (Neurology)", 16, 1300, 4.7, "stroke recovery, epilepsy, headache, dizziness, nerve pain", { times: MORNING }],

  ["u-doc11", "Anika Tabassum", "Dhaka", "Dermatology", "MBBS, MD (Dermatology)", 8, 1000, 4.7, "acne, eczema, skin rash, hair fall, fungal infection, allergy", { times: EVENING }],
  ["u-doc12", "Zahid Hasan", "Chattogram", "Dermatology", "MBBS, DDV", 14, 900, 4.5, "psoriasis, itching, skin allergy, dandruff, warts", { times: MIXED }],

  ["u-doc15", "Habibur Rahman", "Dhaka", "Gastroenterology", "MBBS, MD (Gastroenterology)", 15, 1400, 4.8, "acidity, gastric ulcer, liver disease, jaundice, constipation", { times: MORNING }],
  ["u-doc16", "Sabina Yasmin", "Khulna", "Gastroenterology", "MBBS, FCPS (Medicine)", 10, 1000, 4.6, "stomach pain, diarrhoea, bloating, acidity, piles", { times: EVENING }],

  ["u-doc17", "Golam Mostafa", "Dhaka", "Pulmonology", "MBBS, MD (Pulmonology)", 17, 1300, 4.7, "asthma, chronic cough, tuberculosis, pneumonia, breathlessness", { times: MIXED }],
  ["u-doc18", "Farzana Islam", "Sylhet", "Pulmonology", "MBBS, DTCD", 9, 900, 4.5, "asthma, wheezing, lung infection, snoring, allergy", { times: MORNING }],

  ["u-doc19", "Lutfun Nahar", "Dhaka", "Paediatrics", "MBBS, DCH", 13, 900, 4.9, "child fever, vaccination, growth, cough in children, newborn care", { times: EVENING }],
  ["u-doc20", "Rezaul Karim", "Chattogram", "Paediatrics", "MBBS, FCPS (Paediatrics)", 11, 1000, 4.6, "child fever, diarrhoea, asthma in children, infant feeding", { times: MORNING }],

  ["u-doc21", "Shamima Akter", "Dhaka", "Gynaecology", "MBBS, FCPS (Gynaecology)", 14, 1200, 4.8, "pregnancy care, irregular periods, pcos, fertility, menopause", { times: MIXED }],
  ["u-doc22", "Nasrin Jahan", "Rajshahi", "Gynaecology", "MBBS, MS (Obstetrics)", 12, 1000, 4.6, "antenatal care, white discharge, periods, breast problems", { times: EVENING }],

  ["u-doc23", "Anwar Hossain", "Dhaka", "Orthopaedics", "MBBS, MS (Orthopaedics)", 16, 1300, 4.7, "knee pain, back pain, fracture, arthritis, sports injury", { times: MORNING }],
  ["u-doc24", "Delwar Hossain", "Khulna", "Orthopaedics", "MBBS, D-Ortho", 10, 900, 4.5, "joint pain, neck pain, shoulder pain, sprain, slip disc", { times: MIXED }],

  ["u-doc25", "Tasnim Ara", "Dhaka", "Psychiatry", "MBBS, MD (Psychiatry)", 9, 1200, 4.8, "anxiety, depression, insomnia, panic attack, stress", { times: EVENING }],
  ["u-doc26", "Mizanur Rahman", "Chattogram", "Psychiatry", "MBBS, FCPS (Psychiatry)", 13, 1100, 4.6, "depression, anxiety, mood disorders, addiction, sleep problems", { times: MORNING }],

  // Awaiting admin verification: they appear in the patient list once the admin approves them.
  ["u-doc2", "Imran Hossain", "Chattogram", "Orthopaedics", "MBBS, MS (Orthopaedics)", 7, 900, 4.4, "fracture, knee pain, back pain", { email: "01822222222", registrationNo: "BMDC-A-51377", status: "pending", times: MIXED }],
  ["u-doc3", "Salma Begum", "Rajshahi", "Gynaecology", "MBBS, DGO", 8, 900, 4.5, "pregnancy care, periods, pcos", { email: "salma@example.com", registrationNo: "BMDC-A-60214", status: "pending", times: MORNING }],
];

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, ".");

export const doctorUsers: User[] = rows.map(([id, name, city, , , , , , , x], i) => ({
  id,
  name: `Dr. ${name}`,
  email: x?.email ?? `${slug(name)}@medireach.com`,
  role: "doctor",
  city,
  status: x?.status ?? "verified",
  registrationNo: x?.registrationNo ?? `BMDC-A-${70000 + i}`,
}));

export const doctorProfiles: DoctorProfile[] = rows.map(([id, name, city, specialty, qualifications, years, fee, rating, treats, x]) => ({
  doctorId: id,
  specialty,
  qualifications,
  experienceYears: years,
  fee,
  bio: `${specialty} doctor in ${city} with ${years} years of experience. Dr. ${name} sees patients by video call and chat.`,
  treats: treats.split(",").map((t) => t.trim()),
  languages: ["Bangla", "English"],
  rating,
  accepting: x?.accepting ?? true,
  days: x?.days ?? DEFAULT_DAYS,
  times: x?.times ?? MIXED,
}));
