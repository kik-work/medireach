"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDashboardData } from "@/components/dashboard/data-provider";
import type { ApiResult } from "@/lib/api";
import { formatBDT } from "@/lib/constants";
import { isPrescriptionValid } from "@/lib/rules";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus, Prescription } from "@/lib/types";

export const selectClass = "h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm";

export function EmptyState({ children }: { children: ReactNode }) {
  return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{children}</CardContent></Card>;
}

export function Notice({ kind, children }: { kind: "ok" | "err"; children: ReactNode }) {
  const Icon = kind === "ok" ? CheckCircle2 : AlertCircle;
  return (
    <p
      role={kind === "err" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
        kind === "ok"
          ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" /> <span>{children}</span>
    </p>
  );
}

/** Success / error message for a form or table. `done` awaits an API call and reports its result. */
export function useFeedback() {
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback((kind: "ok" | "err", text: string) => {
    clearTimeout(timer.current);
    setMsg({ kind, text });
    if (kind === "ok") timer.current = setTimeout(() => setMsg(null), 4000);
  }, []);

  const done = useCallback(
    async <T,>(call: Promise<ApiResult<T>>, okText: string) => {
      const r = await call;
      if (r.ok) show("ok", okText);
      else show("err", r.error);
      return r;
    },
    [show],
  );

  return { done, show, clear: () => setMsg(null), node: msg ? <Notice kind={msg.kind}>{msg.text}</Notice> : null };
}

export function PrescriptionList({
  items,
  party,
  actions,
}: {
  items: Prescription[];
  party: "doctor" | "patient";
  actions?: (rx: Prescription) => ReactNode;
}) {
  const { medicines, users } = useDashboardData();
  const medicine = (id: string) => medicines.find((m) => m.id === id);
  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-4">
      {items.map((rx) => {
        const valid = isPrescriptionValid(rx);
        const who = party === "doctor"
          ? `Patient: ${userName(rx.patientId)}`
          : rx.uploaded ? `Uploaded by you${rx.doctorName ? ` · ${rx.doctorName}` : ""}` : `By ${userName(rx.doctorId)}`;
        return (
          <Card key={rx.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {rx.id}
                <Badge variant={valid ? "default" : "outline"}>{valid ? "Valid" : "Expired"}</Badge>
                {rx.uploaded && <Badge variant="secondary">Uploaded copy</Badge>}
                <span className="ml-auto text-sm font-normal text-muted-foreground">{who} · {rx.issuedAt} → {rx.validUntil}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">Diagnosis: {rx.diagnosis || "—"}</p>
              {rx.fileName && <p className="flex items-center gap-1.5 text-muted-foreground"><Paperclip className="size-3.5" /> {rx.fileName}</p>}
              <ul className="divide-y rounded-lg border">
                {rx.items.map((i) => {
                  const m = medicine(i.medicineId);
                  return (
                    <li key={i.medicineId} className="flex flex-wrap justify-between gap-x-4 gap-y-1 p-2.5">
                      <span className="font-medium">{m ? `${m.brand} ${m.strength}` : "Removed medicine"} {m && <span className="font-normal text-muted-foreground">({m.generic})</span>}</span>
                      <span className="text-muted-foreground">{i.dose} · {i.days} days</span>
                    </li>
                  );
                })}
              </ul>
              {actions && <div className="flex flex-wrap justify-end gap-2">{actions(rx)}</div>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface OrdersTableProps {
  orders: Order[];
  show?: { patient?: boolean; pharmacy?: boolean };
  actions?: (order: Order) => ReactNode;
  /** Extra content under the item list (for example an Rx compliance note). */
  note?: (order: Order) => ReactNode;
  empty?: string;
}

export function OrdersTable({ orders, show = { pharmacy: true }, actions, note, empty = "No orders yet." }: OrdersTableProps) {
  const { medicines, pharmacies, users } = useDashboardData();
  if (orders.length === 0) return <EmptyState>{empty}</EmptyState>;
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              {show.patient && <TableHead>Patient</TableHead>}
              {show.pharmacy && <TableHead>Pharmacy</TableHead>}
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              {actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.id}<div className="text-xs font-normal text-muted-foreground">{o.createdAt}</div></TableCell>
                {show.patient && <TableCell>{users.find((u) => u.id === o.patientId)?.name ?? "Unknown"}</TableCell>}
                {show.pharmacy && <TableCell>{pharmacies.find((p) => p.id === o.pharmacyId)?.name}</TableCell>}
                <TableCell className="whitespace-normal">
                  {o.lines.map((l) => `${medicines.find((m) => m.id === l.medicineId)?.brand ?? "Removed medicine"} ×${l.quantity}`).join(", ")}
                  {note?.(o)}
                </TableCell>
                <TableCell>{formatBDT(o.total)}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
                {actions && <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2">{actions(o)}</div></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "placed", label: "Placed" },
  { status: "confirmed", label: "Confirmed" },
  { status: "packed", label: "Packed" },
  { status: "delivered", label: "Delivered" },
];

/** Step tracker for one order. Pre-orders wait before "Confirmed"; cancelled orders show a single badge. */
export function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === "cancelled") return <StatusBadge status="cancelled" />;
  const index = status === "pre-order" ? 0 : STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="flex items-center gap-1 text-xs" aria-label={`Order status: ${status}`}>
      {STEPS.map((s, i) => (
        <li key={s.status} className="flex flex-1 items-center gap-1">
          <span className={cn("flex items-center gap-1.5 whitespace-nowrap font-medium", i <= index ? "text-primary" : "text-muted-foreground")}>
            <span className={cn("flex size-5 items-center justify-center rounded-full border text-[10px]", i <= index ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{i + 1}</span>
            <span className="hidden sm:inline">{i === 0 && status === "pre-order" ? "Pre-order" : s.label}</span>
          </span>
          {i < STEPS.length - 1 && <span className={cn("h-px flex-1", i < index ? "bg-primary" : "bg-border")} />}
        </li>
      ))}
    </ol>
  );
}

export const confirmAction = (text: string) => typeof window === "undefined" || window.confirm(text);
