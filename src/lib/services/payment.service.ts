import { randomBytes } from "node:crypto";
import { today } from "@/lib/rules";
import type { Payment, PaymentMethod } from "@/lib/types";

/**
 * Simulated payment gateway. No money moves and no real network is contacted.
 * Only the method, a masked account (last 4 digits) and a generated reference are stored;
 * full card or wallet numbers are never saved.
 *
 * Test inputs:
 * - bKash: any number in the form 01XXXXXXXXX (11 digits). A number ending in 0000 is declined.
 * - Card: any number that passes the Luhn check, e.g. 4242 4242 4242 4242, with a future MM/YY expiry.
 *   A card ending in 0002 (e.g. 4000 0000 0000 0002) is declined.
 */
export const PAYMENT_METHODS: PaymentMethod[] = ["cod", "bkash", "card"];

export interface PaymentInput {
  method?: string;
  /** bKash wallet number or card number. */
  account?: string;
  /** Card expiry "MM/YY". */
  expiry?: string;
}

export type PaymentResult = { ok: true; payment: Payment } | { ok: false; error: string };

const digits = (s: unknown) => String(s ?? "").replace(/[\s-]/g, "");

export function luhn(number: string) {
  let sum = 0;
  for (let i = 0; i < number.length; i++) {
    let d = Number(number[number.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return number.length >= 12 && sum % 10 === 0;
}

/** true when "MM/YY" is this month or later. */
export function expiryValid(expiry: string, now = new Date()) {
  const m = /^(\d{2})\/(\d{2})$/.exec(expiry.trim());
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  return year > now.getUTCFullYear() || (year === now.getUTCFullYear() && month >= now.getUTCMonth() + 1);
}

const reference = (method: PaymentMethod) => `SIM-${method === "bkash" ? "BK" : "CD"}-${randomBytes(3).toString("hex").toUpperCase()}`;

/** Validates the input and "charges" it. Cash on delivery is never charged up front. */
export function authorize(input: PaymentInput | undefined): PaymentResult {
  const method = (input?.method ?? "cod") as PaymentMethod;
  if (!PAYMENT_METHODS.includes(method)) return { ok: false, error: "Choose a payment method." };
  if (method === "cod") return { ok: true, payment: { method, status: "unpaid" } };

  const account = digits(input?.account);
  if (method === "bkash") {
    if (!/^01\d{9}$/.test(account)) return { ok: false, error: "Enter an 11-digit bKash number, e.g. 017XXXXXXXX." };
    if (account.endsWith("0000")) return { ok: false, error: "Payment declined by bKash (simulated). Try another number or cash on delivery." };
  } else {
    if (!/^\d{12,19}$/.test(account) || !luhn(account)) return { ok: false, error: "Enter a valid card number." };
    if (!expiryValid(String(input?.expiry ?? ""))) return { ok: false, error: "Enter a valid expiry date (MM/YY)." };
    if (account.endsWith("0002")) return { ok: false, error: "Card declined (simulated). Try another card or cash on delivery." };
  }
  return { ok: true, payment: { method, status: "paid", ref: reference(method), account: account.slice(-4), paidAt: today() } };
}

/** Cash collected by the pharmacy on delivery. */
export function collectOnDelivery(payment: Payment | undefined): Payment {
  const p = payment ?? { method: "cod", status: "unpaid" };
  if (p.status !== "unpaid") return p;
  return { ...p, status: "paid", ref: p.ref ?? `SIM-CASH-${randomBytes(3).toString("hex").toUpperCase()}`, paidAt: today() };
}

/** A cancelled order: a prepaid amount is refunded, an unpaid one stays unpaid. */
export function refund(payment: Payment | undefined): Payment {
  const p = payment ?? { method: "cod", status: "unpaid" };
  return p.status === "paid" ? { ...p, status: "refunded", refundedAt: today() } : p;
}

