"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CheckCircle2, Minus, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CautionPanel } from "@/components/caution/caution-panel";
import { RxBadge } from "@/components/shared/status-badge";
import { formatBDT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CautionReport, Order, Prescription } from "@/lib/types";
import { subscribeStore } from "@/lib/auth-store";
import { addOrders, getDataSnapshot, parseOverlay, prescribedMedicineIds, today } from "@/lib/dashboard-store";
import { useAuth } from "@/components/auth/auth-provider";
import { useCart } from "./cart-provider";

/** Prescriptions covering this patient: seed ones from the server + ones saved in the browser. */
export function CartView({ seedPrescriptions }: { seedPrescriptions: Prescription[] }) {
  const { user } = useAuth();
  const patient = user?.role === "patient" ? user : null;
  const patientName = patient?.name ?? null;
  const rawData = useSyncExternalStore(subscribeStore, getDataSnapshot, () => null);
  const prescribedIds = useMemo(
    () => (patient ? prescribedMedicineIds([...parseOverlay(rawData).prescriptions, ...seedPrescriptions], patient.id) : []),
    [patient, rawData, seedPrescriptions],
  );
  const { lines, total, setQuantity, remove, clear } = useCart();
  const [report, setReport] = useState<CautionReport | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string[] | null>(null);

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

  /** One order per pharmacy, saved in the browser. Rx-only items need a valid prescription on file. */
  function checkout() {
    if (!patient) return;
    setError(null);
    if (blocked.length > 0) return setError("A valid prescription is required for Rx-only medicines.");
    setPlacing(true);
    const stamp = Date.now().toString(36).toUpperCase();
    const orders: Order[] = [...Map.groupBy(lines, (l) => l.pharmacyId)].map(([pharmacyId, group], i) => ({
      id: `ORD-${stamp}${i + 1}`,
      patientId: patient.id,
      pharmacyId,
      lines: group.map((l) => ({ medicineId: l.medicineId, quantity: l.quantity, unitPrice: l.unitPrice })),
      total: group.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0),
      status: "placed",
      createdAt: today(),
    }));
    addOrders(orders);
    setPlaced(orders.map((o) => o.id));
    clear();
    setPlacing(false);
  }

  if (placed) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <CheckCircle2 className="size-10 text-primary" />
          <h2 className="text-lg font-semibold">Order placed</h2>
          <p className="text-sm text-muted-foreground">Reference: {placed.join(", ")}. Pay on delivery.</p>
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
          <p className="text-xs text-muted-foreground">Payment: cash on delivery.</p>

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
              {error && <p className="text-rose-600">{error}</p>}
              <Button className="w-full" disabled={blocked.length > 0 || placing} onClick={checkout}>
                {placing ? "Placing…" : "Place order"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
