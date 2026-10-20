import type { User } from "@/lib/types";

/**
 * Seed accounts. `email` is the login id (an email or a phone number).
 * Demo passwords are in accounts.ts.
 */
export const users: User[] = [
  { id: "u-pat1", name: "Rahim Uddin", email: "patient@medireach.com", role: "patient", city: "Dhaka", status: "verified" },
  { id: "u-pat2", name: "Nusrat Jahan", email: "01711111111", role: "patient", city: "Sylhet", status: "verified" },
  { id: "u-pat3", name: "Karim Chowdhury", email: "karim@example.com", role: "patient", city: "Chattogram", status: "verified" },
  { id: "u-doc1", name: "Dr. Farhana Akter", email: "doctor@medireach.com", role: "doctor", city: "Dhaka", status: "verified", registrationNo: "BMDC-A-45821" },
  { id: "u-doc2", name: "Dr. Imran Hossain", email: "01822222222", role: "doctor", city: "Chattogram", status: "pending", registrationNo: "BMDC-A-51377" },
  { id: "u-doc3", name: "Dr. Salma Begum", email: "salma@example.com", role: "doctor", city: "Rajshahi", status: "pending", registrationNo: "BMDC-A-60214" },
  { id: "u-ph1", name: "Kamal Hossain", email: "pharmacist@medireach.com", role: "pharmacist", city: "Dhaka", status: "verified", registrationNo: "PCB-7782", pharmacyId: "ph3" },
  { id: "u-ph2", name: "Tania Rahman", email: "01933333333", role: "pharmacist", city: "Dhaka", status: "pending", registrationNo: "PCB-9015", pharmacyId: "ph8" },
  { id: "u-admin", name: "System Admin", email: "admin@medireach.com", role: "admin", city: "Dhaka", status: "verified" },
];
