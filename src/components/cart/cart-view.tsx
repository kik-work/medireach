"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Minus, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CautionPanel } from "@/components/caution/caution-panel";
import { RxBadge } from "@/components/shared/status-badge";
import { formatBDT, PAYMENT_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CautionReport, Order, PaymentMethod, Prescription } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { prescribedMedicineIds } from "@/lib/rules";
import { useAuth } from "@/components/auth/auth-provider";
import { useCart } from "./cart-provider";

/** Cart + checkout. Rx-only items are checked against the patient's valid prescriptions on the server. */
export function CartView() {
  const { user } = useAuth();
  const patient = user?.role === "patient" ? user : null;
  const patientName = patient?.name ?? null;
  const patientId = patient?.id;
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    api<Prescription[]>("GET", "/api/prescriptions").then((r) => {
      if (!cancelled && r.ok) setPrescriptions(r.data);
    });
    return () => { cancelled = true; };
  }, [patientId]);
  const prescribedIds = patientId ? prescribedMedicineIds(prescriptions, patientId) : [];
  const { lines, total, setQuantity, remove, clear } = useCart();
  const [report, setReport] = useState<CautionReport | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string[] | null>(null);
  const [preOrder, setPreOrder] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [account, setAccount] = useState("");
  const [expiry, setExpiry] = useState("");
  const [paidRef, setPaidRef] = useState<string[]>([]);

  const medicineKey = [...new Set(lines.map((l) => l.medicineId))].sort().join(",");

  useEffect(() => {
    if (!medicineKey) return setReport(null);
    fetch("/api/caution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicineIds: medicineKey.split(",") }),
    })
      .then((r) => r.json())
      .then((j) => setReport(j.data));
  }, [medicineKey]);

  const blocked = lines.filter((l) => l.rx && !prescribedIds.includes(l.medicineId));

  /** One order per pharmacy, saved on the server. Out-of-stock lines become a pre-order. */
  async function checkout() {
    if (!patient) return;
    setError(null);
    if (blocked.length > 0) return setError("A valid prescription is required for Rx-only medicines.");
    setPlacing(true);
    const r = await api<Order[]>("POST", "/api/orders", {
      lines: lines.map((l) => ({ medicineId: l.medicineId, pharmacyId: l.pharmacyId, quantity: l.quantity })),
      payment: { method, account, expiry },
    });
    setPlacing(false);
    if (!r.ok) return setError(r.blocked?.length ? `${r.error} (${r.blocked.join(", ")})` : r.error);
    setPlaced(r.data.map((o) => o.id));
    setPreOrder(r.data.some((o) => o.status === "pre-order"));
    setPaidRef(r.data.flatMap((o) => (o.payment?.status === "paid" && o.payment.ref ? [o.payment.ref] : [])));
    setAccount("");
    setExpiry("");
    clear();
  }

  if (placed) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <CheckCircle2 className="size-10 text-primary" />
          <h2 className="text-lg font-semibold">Order placed</h2>
          <p className="text-sm text-muted-foreground">Reference: {placed.join(", ")}. {paidRef.length ? `Paid (simulated), transaction ${paidRef.join(", ")}.` : "Pay on delivery."}{preOrder && " Some items are out of stock, so that order is a pre-order and the pharmacy will confirm when it arrives."}</p>
          <Link href="/patient/orders" className={buttonVariants()}>Track orders</Link>
        </CardContent>
      </Card>
    );
  }

  if (lines.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Link href="/medicines" className={buttonVariants()}>Browse medicines</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {lines.map((l) => (
              <div key={l.medicineId + l.pharmacyId} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{l.brand} <span className="font-normal text-muted-foreground">{l.strength} · {l.generic}</span></p>
                  <p className="text-xs text-muted-foreground">{l.pharmacyName} · {formatBDT(l.unitPrice)} each</p>
                  <div className="mt-1 flex items-center gap-2">
                    <RxBadge rx={l.rx} />
                    {l.rx && !prescribedIds.includes(l.medicineId) && (
                      <span className="flex items-center gap-1 text-xs text-rose-600"><ShieldAlert className="size-3" /> No valid prescription</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon-sm" variant="outline" onClick={() => setQuantity(l.medicineId, l.pharmacyId, l.quantity - 1)}><Minus /></Button>
                  <span className="w-8 text-center text-sm">{l.quantity}</span>
                  <Button size="icon-sm" variant="outline" onClick={() => setQuantity(l.medicineId, l.pharmacyId, l.quantity + 1)}><Plus /></Button>
                </div>
                <p className="w-20 text-right font-medium">{formatBDT(l.quantity * l.unitPrice)}</p>
                <Button size="icon-sm" variant="ghost" onClick={() => remove(l.medicineId, l.pharmacyId)}><Trash2 /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
        {report && <CautionPanel report={report} />}
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatBDT(total)}</span></div>

          {!patientName ? (
            <Link href="/login" className={cn(buttonVariants(), "w-full")}>Log in as patient to order</Link>
          ) : (
            <>
              <p className="text-muted-foreground">Ordering as <b>{patientName}</b></p>
              {blocked.length > 0 && (
                <p className="rounded-md border border-rose-300 bg-rose-50 p-3 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                  Rx-only items need a valid prescription: {blocked.map((b) => b.brand).join(", ")}. Remove them or ask your doctor to issue one.
                </p>
              )}
              <fieldset className="space-y-2">
                <legend className="mb-1 font-medium">Payment</legend>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["cod", "bkash", "card"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => { setMethod(m); setAccount(""); setExpiry(""); setError(null); }}
                      aria-pressed={method === m}
                      className={cn("rounded-md border px-2 py-1.5 text-xs", method === m ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
                      {PAYMENT_LABEL[m]}
                    </button>
                  ))}
                </div>
                {method === "bkash" && (
                  <Input inputMode="numeric" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="bKash number, 01XXXXXXXXX" aria-label="bKash number" maxLength={14} />
                )}
                {method === "card" && (
                  <div className="grid grid-cols-[1fr_88px] gap-1.5">
                    <Input inputMode="numeric" autoComplete="off" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Card number" aria-label="Card number" maxLength={23} />
                    <Input autoComplete="off" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" aria-label="Expiry" maxLength={5} />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {method === "cod"
                    ? "Pay the pharmacy when the order arrives."
                    : "Simulated payment: no money moves. Use a test number, e.g. 01712345678 or card 4242 4242 4242 4242. Only the last 4 digits are kept."}
                </p>
              </fieldset>
              {error && <p className="text-rose-600">{error}</p>}
              <Button className="w-full" disabled={blocked.length > 0 || placing} onClick={checkout}>
                {placing ? "Placing…" : method === "cod" ? "Place order" : `Pay ${formatBDT(total)} and place order`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
