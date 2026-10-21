import type { ChatMessage } from "@/lib/types";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const DAY = 60 * 24;

export const messages: ChatMessage[] = [
  { id: "msg-1", appointmentId: "ap-4", senderId: "u-pat1", text: "Good morning doctor. My BP reading was 150/95 this morning.", createdAt: ago(10 * DAY) },
  { id: "msg-2", appointmentId: "ap-4", senderId: "u-doc1", text: "Thank you. Please send me your lipid profile as well. I will write a prescription after the review.", createdAt: ago(10 * DAY - 3) },
  { id: "msg-3", appointmentId: "ap-4", senderId: "u-pat1", text: "Uploaded the report just now.", createdAt: ago(10 * DAY - 6) },
  { id: "msg-4", appointmentId: "ap-4", senderId: "u-doc1", text: "Prescription issued. Take the medicines as written and order them from MediReach.", createdAt: ago(10 * DAY - 20) },
];
